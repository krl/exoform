var ipfs = require('ipfs-api')('localhost', 5001)
var sink = require('stream-sink')

var memo = {}

var exoform = {
  put: function (blob, cb) {
    ipfs.add(new Buffer(blob), function (err, res) {
      if (err) return cb(err)
      cb(null, res[0].Hash)
    })
  },
  require: function (refs, hash, cb) {
    console.log('requiering', hash)
    if (hash.length < 32) {
      var cycle = parseInt(hash)
      cb(refs[refs.length - cycle - 1])
    } else {
      if (memo[hash]) return cb(memo[hash])
      ipfs.cat(hash, function (err, stream) {
        if (err) return cb(err)
        var mod = {}
        var newrefs = refs.slice()
        newrefs.push(mod)
        stream.pipe(sink())
          .on('data', function (data) {
            var meta = {
              exoform: exoform,
              self: hash,
              refs: newrefs,
              mod: mod }
            meta.define = function (module) {
              memo[hash] = module
              Object.defineProperty(module, '__meta', {
                value: meta
              })
              cb(module)
              return module
            }
            new Function(data)(meta)
          })
          .on('error', function (err) { throw err })
      })
    }
  }
}

module.exports = exoform
