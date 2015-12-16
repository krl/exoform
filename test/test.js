var test = require('tape')
var exec = require('child_process').exec
var a = require('async')
var p = require('path')

var compareOutput = function (file, cb) {
  var clifile = __dirname + '/../src/cli.js'
  var relfile = p.relative(process.cwd(), __dirname + '/' + file)

  a.parallel([
    function (cb) {
      var cmd = 'node ' + relfile
      exec(cmd, function (err, stdout, stderr) {
        cb(err, stdout)
      })
    },
    function (cb) {
      var cmd = 'node ' + clifile + ' ' + relfile +
        ' | ipfs cat | node'
      exec(cmd, function (err, stdout, stderr) {
        cb(err, stdout)
      })
    }], cb)
}

test('require test', function (t) {
  compareOutput('req/one.js', function (err, res) {
    if (err) return t.fail(err)
    t.equal(res[0], res[1])
    t.end()
  })
})

test('require cycle test', function (t) {
  compareOutput('req/cycle.js', function (err, res) {
    if (err) return t.fail(err)
    t.equal(res[0], res[1])
    t.end()
  })
})
