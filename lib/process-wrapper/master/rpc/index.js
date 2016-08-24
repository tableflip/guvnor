'use strict'

const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const fs = require('fs-promise')
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
    sendEvent: require('./send-event'),
    sendSignal: require('./send-signal'),
    reportStatus: require('./report-status'),
    setNumWorkers: require('./set-num-workers')

    /*
    write: require('./write'),
    */
  }

  // publish RPC methods
  const rpc = dnode(dnodep.toDnode(api), {
    timeout: timeout
  })

  return fs.unlink(socket)
  .catch(() => {})
  .then(() => new Promise((resolve, reject) => {
    rpc.listen(socket, (error) => {
      if (error) {
        return reject(error)
      }

      return resolve()
    })
  }))
  .then(() => fs.chmod(socket, parseInt('0660', 8)))
  .then(() => {
    process.on('exit', cleanup)
    process.on('SIGINT', cleanup)

    return rpc
  })
}
