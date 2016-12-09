'use strict'

const SocketIO = require('socket.io')
const config = require('../config')
const USN = require('../../common/ssdp-usn')
const ssdp = require('@achingbrain/ssdp')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'web:websocket'

let socket
let hosts = config.HOSTS.map(host => host)

module.exports = function (context, server) {
  if (arguments.length === 0) {
    return Promise.resolve(socket)
  } else if (arguments.length === 2) {
    context.log([DEBUG, CONTEXT], 'Configuring web socket server')

    socket = SocketIO.listen(server.listener)
    socket.on('connection', client => {
      context.log([DEBUG, CONTEXT], `Client connected, sending ${hosts}`)

      hosts.forEach(host => {
        context.log([DEBUG, CONTEXT], `Emitting host ${host}`)
        client.emit('host', host)
      })
    })

    const bus = ssdp()
    bus.on('error', error => {
      context.log([WARN, CONTEXT], `SSDP error: ${error.message}`)
    })

    setInterval(bus.discover.bind(bus, USN), 1000)

    bus.on('discover:' + USN, (service) => {
      context.log([DEBUG, CONTEXT], `Found host ${service.details.URLBase}`)

      const present = hosts.some(host => host === service.details.URLBase)

      if (!present) {
        hosts.push(service.details.URLBase)

        context.log([DEBUG, CONTEXT], `Host ${service.details.URLBase} was new`)

        socket.emit('host', service.details.URLBase)
      } else {
        context.log([DEBUG, CONTEXT], `Have seen ${service.details.URLBase} before`)
      }

      bus.on('update:' + service.UDN, service => {
        // receive a notification when that service is updated - nb. this will only happen
        // after the service max-age is reached and if the service's device description
        // document has changed
      })

      bus.on('remove:' + service.UDN, service => {
        hosts = hosts.filter(host => host !== service.details.URLBase)
      })
    })

    return Promise.resolve('Ok!')
  }

  return Promise.reject(new Error('Expected zero or two arguments'))
}
