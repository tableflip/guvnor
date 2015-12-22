var async = require('async')
var dnode = require('boss-dnode')
var fs = require('fs')

var timeout = process.env.GUVNOR_RPC_TIMEOUT
var socket = process.env.GUVNOR_RPC_SOCKET

var SIGHUP = 1

function cleanup (signal) {
  if (signal === SIGHUP) {
    // sighup means our starting tty has been closed - we are a daemon process so we dont' care
    return
  }

  try {
    fs.unlinkSync(socket)
  } catch (e) {
    console.error(e)
  }

  process.exit(0)
}

module.exports = function startDnodeServer (callback) {
  var api = {
    forceGc: require('./force-gc'),
    takeHeapSnapshot: require('./take-heap-snapshot'),
    listHeapSnapshots: require('./list-heap-snapshots'),
    removeHeapSnapshot: require('./remove-heap-snapshot'),
    fetchHeapSnapshot: require('./fetch-heap-snapshot'),

    /*

    send: require('./send'),
    signal: require('./signal'),
    write: require('./write'),
    */

    reportStatus: require('./report-status'),
    setNumWorkers: require('../update-workers')
  }

  // publish RPC methods
  var rpc = dnode(api, {
    timeout: timeout
  })

  async.series([
    function (next) {
      fs.unlink(socket, function () {
        next()
      })
    },
    rpc.listen.bind(rpc, socket),
    fs.chmod.bind(fs, socket, parseInt('0660', 8))
  ], function (error) {
    if (error) {
      console.error('Threw error', error)
    }

    process.once('exit', cleanup)
    process.on('SIGINT', cleanup)

    callback(error, socket)
  })
}
