var dump = require('cdump')

var memo = {}

var exoform = {
  put: dump.put,
  cache: function (hash, val) {
    memo[hash] = val
  },
  require: function (refs, hash, cb) {
    if (hash.length < 32) {
      var cycle = parseInt(hash, 10)
      cb(refs[refs.length - cycle - 1])
    } else {
      if (memo[hash]) return cb(memo[hash])
      dump.get(hash, function (err, data) {
        if (err) return cb(err)
        var mod = {}
        var newrefs = refs.slice()
        newrefs.push(mod)
        var meta = {
          exoform: exoform,
          self: hash,
          refs: newrefs,
          mod: mod }
        meta.define = function (module) {
          if (!module.__meta) {
            Object.defineProperty(module, '__meta', {
              value: meta
            })
          }
          if (!module.__hash) {
            Object.defineProperty(module, '__hash', {
              value: hash
            })
          }
          memo[hash] = module
          cb(module)
          return module
        }
        new Function(data.toString())(meta) // eslint-disable-line
      })
    }
  }
}

module.exports = exoform
