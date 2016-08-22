'use strict'

const through2 = require('through2')
const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const daemon = require('./daemon')

module.exports = function (worker) {
  const stream = through2.obj(function sendMessageToWorker (chunk, enc, next) {
    worker.send({
      dnode: true,
      request: chunk
    })

    next()
  })

  const api = {
    event: daemon
  }

  let d

  worker.on('message', function onWorkerMessage (message) {
    if (!message.dnode) {
      return
    }

    // initialise server end only once first dnode message is received - this way
    // we know the worker is ready and we don't miss the initial 'methods' exchange
    if (!d) {
      d = dnode(dnodep.toDnode(api))
      d.on('error', function onWorkerError (error) {
        console.error(error)
      })
      d.on('remote', function onWorkerConnected (remote) {
        remote = dnodep.toPromise(remote)

        worker.rpc = remote
      })
      d.pipe(stream).pipe(d)
    }

    d.write(message.request)
  })
}
