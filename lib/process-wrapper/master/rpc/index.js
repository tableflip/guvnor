'use strict'

const async = require('async')
const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const fs = require('fs')
const config = require('../../config')
const emit = require('../daemon')

const timeout = process.env[`${config.DAEMON_NAME.toUpperCase()}_RPC_TIMEOUT`]
const socket = process.env[`${config.DAEMON_NAME.toUpperCase()}_RPC_SOCKET`]

const SIGHUP = 1

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

  // have to do this synchronously as no async is allowed inside process.on('exit')
  emit.sync('process:stopping')

  process.exit(0)
}

module.exports = function startDnodeServer (callback) {
  const api = {
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
  const rpc = dnode(dnodep.toDnode(api), {
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

    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)

    callback(error, socket)
  })
}
