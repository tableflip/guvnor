var dnode = require('boss-dnode')
var through2 = require('through2')

var timeout = process.env.GUVNOR_RPC_TIMEOUT

module.exports = function startDnodeServer (callback) {
  var stream = through2.obj(function (chunk, enc, callback) {
    process.send({
      dnode: true,
      request: chunk
    })

    callback()
  })

  var api = {
    forceGc: require('./force-gc'),
    listHeapSnapshots: require('./list-heap-snapshots'),
    removeHeapSnapshot: require('./remove-heap-snapshot'),
    reportStatus: require('./report-status'),
    send: require('./send'),
    takeHeapSnapshot: require('./take-heap-snapshot'),
    write: require('./write')
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
