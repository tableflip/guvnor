var SocketIO = require('socket.io')
var config = require('../config')
var USN = require('../../common/ssdp-usn')

var websocket
var ssdp = require('@achingbrain/ssdp')
var bus = ssdp()
bus.on('error', console.error)

var hosts = config.HOSTS.map(function (host) {
  return host
})

setInterval(bus.discover.bind(bus, USN), 1000)

bus.on('discover:' + USN, function (service) {
  var present = hosts.some(function (host) {
    return host === service.details.URLBase
  })

  if (!present) {
    hosts.push(service.details.URLBase)

    websocket.emit('host', service.details.URLBase)
  }

  bus.on('update:' + service.UDN, function (service) {
    // receive a notification when that service is updated - nb. this will only happen
    // after the service max-age is reached and if the service's device description
    // document has changed
  })

  bus.on('remove:' + service.UDN, function (service) {
    hosts = hosts.filter(function (host) {
      return host !== service.details.URLBase
    })
  })
})

module.exports = function () {
  var callback = arguments[0]

  if (arguments.length === 2) {
    callback = arguments[1]
    websocket = SocketIO.listen(arguments[0].listener)

    websocket.on('connection', function (client) {
      hosts.forEach(function (host) {
        client.emit('host', host)
      })
    })
  }

  callback(null, websocket)
}
