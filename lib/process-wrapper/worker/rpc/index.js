var dnode = require('boss-dnode')
var through2 = require('through2')

var timeout = process.env.GUVNOR_RPC_TIMEOUT

module.exports = function startDnodeServer (callback) {
  var stream = through2.obj(function (chunk, enc, next) {
    process.send({
      dnode: true,
      request: chunk
    })

    next()
  })

  var api = {
    forceGc: require('./force-gc'),
    reportStatus: require('./report-status'),
    send: require('./send'),
    takeHeapSnapshot: require('./take-heap-snapshot')
  }

  // publish RPC methods
  var d = dnode(api, {
    timeout: timeout
  })
  d.on('error', function (error) {
    console.error(error)
  })
  d.on('remote', function (master) {
    callback(null, master)
  })
  stream.pipe(d).pipe(stream)

  process.on('message', function (message) {
    if (!message.dnode) {
      return
    }

    d.write(message.request)
  })
}
