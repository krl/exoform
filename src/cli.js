#! /usr/bin/env node
var argv = require('minimist')(process.argv.slice(2))
var transform = require('exoform-bundle')
var fs = require('fs')

var debug = function () {
  if (argv.v) console.error.apply(this, arguments)
}

var cacheFile = process.cwd() + '/.exoform-cache'
var diskCache = {}
try {
  diskCache = JSON.parse(fs.readFileSync(cacheFile))
} catch (e) {}

transform(process.cwd() + '/' + argv._[0], [], diskCache, function (err, res) {
  if (err) throw err
  if (argv.c) {
    debug('writing cache...')
    fs.writeFileSync(cacheFile, JSON.stringify(diskCache) + '\n')
  }
  console.log(res)
})
