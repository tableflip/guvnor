var through2 = require('through2')
var dnode = require('boss-dnode')
var daemon = require('./daemon')

module.exports = function (worker) {
  var stream = through2.obj(function (chunk, enc, callback) {
    worker.send({
      dnode: true,
      request: chunk
    })

    callback()
  })

  var d = dnode({
    event: function (type, args) {
      daemon.send(type, args)
    }
  })
  d.on('error', function (error) {
    console.error(error)
  })
  d.on('remote', function (remote) {
    worker.rpc = remote
  })
  stream.pipe(d).pipe(stream)

  worker.on('message', function (message) {
    if (!message.dnode) {
      return
    }

    d.write(message.request)
  })
}
