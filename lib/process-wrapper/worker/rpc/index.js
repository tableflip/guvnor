'use strict'

const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const through2 = require('through2')
const config = require('../../config')

const timeout = process.env[`${config.DAEMON_ENV_NAME}_RPC_TIMEOUT`]

const startDnodeServer = () => {
  return new Promise((resolve, reject) => {
    const stream = through2.obj(function (chunk, enc, next) {
      process.send({
        dnode: true,
        request: chunk
      })

      next()
    })

    const api = {
      forceGc: require('./force-gc'),
      reportStatus: require('./report-status'),
      sendEvent: require('./send-event'),
      takeHeapSnapshot: require('./take-heap-snapshot')
    }

    // publish RPC methods
    const d = dnode(dnodep.toDnode(api), {
      timeout: timeout
    })
    d.on('error', function (error) {
      console.error(error)
    })
    d.on('remote', function (master) {
      master = dnodep.toPromise(master)

      resolve(master)
    })
    stream.pipe(d).pipe(stream)

    process.on('message', function (message) {
      if (!message.dnode) {
        return
      }

      d.write(message.request)
    })
  })
}

module.exports = startDnodeServer
