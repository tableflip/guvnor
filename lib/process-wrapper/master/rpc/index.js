var async = require('async')
var dnode = require('boss-dnode')
var fs = require('fs')
var path = require('path')
var cluster = require('cluster')

var timeout = process.env.GUVNOR_RPC_TIMEOUT
var socket = path.join(process.env.GUVNOR_RUNDIR, 'processes', process.env.GUVNOR_PROCESS_NAME + '.sock')

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
    /*fetchHeapSnapshot: require('./fetch-heap-snapshot'),
    forceGc: require('./force-gc'),
    listHeapSnapshots: require('./list-heap-snapshots'),
    removeHeapSnapshot: require('./remove-heap-snapshot'),*/
    reportStatus: require('./report-status')
    /*send: require('./send'),
    signal: require('./signal'),
    takeHeapSnapshot: require('./take-heap-snapshot'),
    write: require('./write')*/
  }

  if (cluster.isMaster) {
    // /api.setNumWorkers = require('./set-num-workers')
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
