var through2 = require('through2')
var dnode = require('boss-dnode')
var daemon = require('./daemon')

module.exports = function (worker) {
  var stream = through2.obj(function sendMessageToWorker (chunk, enc, next) {
    worker.send({
      dnode: true,
      request: chunk
    })

    next()
  })

  var api = {
    event: daemon
  }

  var d

  worker.on('message', function onWorkerMessage (message) {
    if (!message.dnode) {
      return
    }

    // initialise server end only once first dnode message is received - this way
    // we know the worker is ready and we don't miss the initial 'methods' exchange
    if (!d) {
      d = dnode(api)
      d.on('error', function onWorkerError (error) {
        console.error(error)
      })
      d.on('remote', function onWorkerConnected (remote) {
        worker.rpc = remote
      })
      d.pipe(stream).pipe(d)
    }

    d.write(message.request)
  })
}
