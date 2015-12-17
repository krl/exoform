#! /usr/bin/env node
var falafel = require('falafel')
var async = require('async')
var argv = require('minimist')(process.argv.slice(2))
var fs = require('fs')
var resolve = require('require-resolve')
var ipfs = require('ipfs-api')('localhost', 5001)
var babel = require('babel-core')
var p = require('path')
var _ = require('lodash')

var debug = function () {
  if (argv.v) console.error.apply(this, arguments)
}

var PREAMBLE =
  'var __meta\n' +
  'if (typeof arguments !== \'undefined\') {\n' +
  '  __meta = arguments[0]\n' +
  '} else {\n' +
  '  __meta = {\n' +
  '    exoform: require(\'exoform\'),\n' +
  '    define: function () {},\n' +
  '    refs: [] } }\n' +
  'var exoform = __meta.exoform\n' +
  'var exports = __meta.mod\n' +
  'var module = { exports: exports }\n'

var POSTAMBLE =
  '\n__meta.define(module.exports)\n'

var readPackageInfo = function (root) {
  return JSON.parse(fs.readFileSync(root + '/package.json'))
}

var defaultReplace = function () {
  return {
    fs: null,
    os: 'os-browserify',
    http: 'http-browserify',
    https: 'http-browserify'
  }
}

var memoTrans = {}

var transform = function (path, encountered, diskCache, cb) {
  if (memoTrans[path]) {
    debug('cache hit', path, memoTrans[path])
    return cb(null, memoTrans[path])
  }
  if (diskCache[path]) {
    debug('disk cache hit', path, diskCache[path])
    return cb(null, diskCache[path])
  }
  // cyclic?
  var cycle = _.findIndex(encountered, function (a) {
    return a === path
  })
  if (cycle !== -1) {
    return cb(null, cycle)
  }

  var replace = defaultReplace()
  try {
    var pkginfo = readPackageInfo(p.dirname(path))
    // always use browser versions
    if (pkginfo.browser instanceof Object) {
      _.assign(replace, pkginfo.browser || {})
    }
  } catch (e) {}

  var src = fs.readFileSync(path).toString()

  var opts = {
    presets: ['es2015'],
    filename: __filename
  }
  var transformed = ';' + src + ';'
  if (argv.b) {
    transformed = babel.transform(src, opts).code
  }
  debug('transforming', path)
  var queue = []
  var depth = 0

  var findReq = function (node) {
    var suffixes = []
    var ref = node
    var found = false
    while (ref) {
      if (ref.type === 'CallExpression') {
        if (ref.callee.name === 'require') {
          found = ref.arguments[0].value
          ref = null
        } else {
          suffixes.unshift('(' + _.map(ref.arguments, function (arg) {
            return arg.raw
          }).join(',') + ')')
          ref = ref.callee
        }
      } else if (ref.type === 'MemberExpression') {
        if (ref.property.type === 'Identifier') {
          suffixes.unshift('.' + (ref.name || ref.property.name))
        } else {
          suffixes.unshift('[' + ref.property.raw + ']')
        }
        ref = ref.object
      } else {
        ref = null
      }
    }
    return found ? { found: found,
                     suffix: suffixes.join('') } : null
  }

  var output = falafel(transformed, function (node) {
    var reqExp, varName
    var prefix = ''

    if (node.type === 'AssignmentExpression') {
      reqExp = findReq(node.right)
      if (reqExp) {
        var ref = node.left
        var prop = ref.name || ref.property.name
        var prefixes = []
        while (ref.object) {
          if (ref.object.name) {
            prefixes.unshift(ref.object.name)
          }
          if (ref.object.property) {
            prefixes.unshift(ref.object.property.name)
          }
          ref = ref.object
        }
        prefix = prefixes.join('.')
        varName = prop
      }
    } else if (node.type === 'VariableDeclaration') {
      reqExp = findReq(node.declarations[0].init)
      varName = node.declarations[0].id.name
    }

    if (reqExp) {
      var toRequire = reqExp.found
      if (typeof replace[toRequire] !== 'undefined') {
        toRequire = replace[toRequire]
      }

      if (toRequire === null) {
        node.update('var ' + varName + ' = {}')
      } else {
        var resolved = resolve(toRequire, path)

        if (!resolved) {
          // resolve to exoform dependencies
          resolved = resolve(toRequire, __filename)
          if (!resolved) {
            throw new Error('could not resolve ' + toRequire)
          }
        }

        var srcPath = resolved.src

        // always use browser version when available
        try {
          var browser = readPackageInfo(resolved.pkg.root).browser
          if (typeof browser === 'string') {
            srcPath = p.join(resolved.pkg.root, browser)
          }
        } catch (e) {}

        // inline json
        if (srcPath.match(/\.json$/)) {
          var src = fs.readFileSync(srcPath).toString()
          node.update('var ' + varName + ' = ' + src)
        } else if (toRequire === 'exoform') {
          // already defined in preamble
          node.update('')
        } else {
          queue.push(srcPath)
          var newString = '__meta.exoform.require(__meta.refs, \'' + srcPath + '\', ' +
            'function (' + varName + ') {'
          if (reqExp.suffix || prefix) {
            newString += '\n' + (prefix ? prefix + '.' : '') +
              varName + ' = ' + varName + reqExp.suffix
          }

          depth++
          node.update(newString)
        }
      }
    }
  }).toString()

  output += POSTAMBLE

  for (var i = 0; i < depth; i++) {
    output += '})'
  }
  depth && (output += '\n')

  encountered.push(path)

  async.reduce(queue, output, function (memo, path, rcb) {
    transform(path, encountered, diskCache, function (err, res) {
      if (err) return cb(err)
      rcb(null, memo.replace(path, res))
    })
  }, function (err, res) {
    if (err) return cb(err)
    if (argv.o) {
      console.log(PREAMBLE + res)
    }

    ipfs.add(new Buffer(PREAMBLE + res), function (err, res) {
      if (err) return cb(err)
      debug(path, res[0].Hash)
      memoTrans[path] = res[0].Hash
      if (path.match('node_modules')) diskCache[path] = res[0].Hash
      cb(null, res[0].Hash)
    })
  })
}

module.exports = transform
