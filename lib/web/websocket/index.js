var logger = require('winston')
var SocketIO = require('socket.io')
var config = require('../config')

var ssdp = require('@achingbrain/ssdp')
var bus = ssdp()
bus.on('error', logger.error)

// this is the unique service name we are interested in:
var usn = 'urn:schemas-upnp-org:service:Guvnor:1'

bus.discover(usn)
bus.on('discover:' + usn, function (service) {
  socket.broadcast.emit('host');

  bus.on('update:' + service.device.UDN, function (service) {
    // receive a notification when that service is updated - nb. this will only happen
    // after the service max-age is reached and if the service's device description
    // document has changed
  })
})

var websocket

module.exports = function () {
  var callback = arguments[0]

  if (arguments.length === 2) {
    logger.debug('Adding websocket listener')
    callback = arguments[1]
    websocket = SocketIO.listen(arguments[0].listener)

    websocket.on('connection', function (client) {
      config.HOSTS.forEach(function (host) {
        client.emit('host', host)
      })
    }.bind(this))
  }

  callback(null, websocket)
}
