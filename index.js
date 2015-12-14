var ipfs = require('ipfs-api')('localhost', 5001)
var sink = require('stream-sink')

var memo = {}

var Exoform = {
  put: function (blob, cb) {
    ipfs.add(new Buffer(blob), function (err, res) {
      if (err) return cb(err)
      cb(null, res[0].Hash)
    })
  },
  require: function (refs, hash, cb) {
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
            (new Function(data))(
              Exoform, // library reference
              hash, // the hash of self
              newrefs, // list of parent modules
              mod, // the module to be initialized
              function (module) {
                memo[hash] = module
                cb(module)
                return module
            })})
          .on('error', function (err) { throw err })
      })
    }
  }
}

module.exports = Exoform
