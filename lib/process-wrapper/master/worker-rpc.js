'use strict'

const through2 = require('through2')
const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const daemon = require('./daemon')
const os = require('os')
const config = require('../config')

const CPUS = os.cpus()
let awaitingWorkers = Number(process.env[`${config.DAEMON_ENV_NAME}_WORKERS`]) || CPUS.length

module.exports = function (worker) {
  const stream = through2.obj(function sendMessageToWorker (chunk, enc, next) {
    worker.send({
      dnode: true,
      request: chunk
    })

    next()
  })

  const api = {
    event: function () {
      const args = Array.prototype.slice.call(arguments)

      daemon.apply(daemon, args)

      if (awaitingWorkers === 0) {
        return
      }

      const event = args[0]

      if (event === 'process:worker:started' && awaitingWorkers > 0) {
        awaitingWorkers--

        if (awaitingWorkers === 0) {
          // we have initialised our requested amount of workers, inform
          // any listeners
          daemon('process:started')
        }
      }
    }
  }

  let d

  worker.on('message', function onWorkerMessage (message) {
    if (!message.dnode) {
      if (message.event) {
        // process.send was used
        api.event.apply(null, [message.event].concat(Array.isArray(message.args) ? message.args : []))
      }

      return
    }

    // initialise server end only once first dnode message is received - this way
    // we know the worker is ready and we don't miss the initial 'methods' exchange
    if (!d) {
      d = dnode(dnodep.toDnode(api))
      d.on('error', (error) => {
        console.error(error)
      })
      d.on('remote', (remote) => {
        remote = dnodep.toPromise(remote)

        worker.rpc = remote
      })
      d.pipe(stream).pipe(d)
    }

    d.write(message.request)
  })
}
