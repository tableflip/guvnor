var DEBUG = require('good-enough').DEBUG
var ERROR = require('good-enough').ERROR
var CONTEXT = 'daemon:start-server:create-ssdp-advert'
var USN = require('../../common/ssdp-usn')
var ssdp = require('@achingbrain/ssdp')
var os = require('os')

module.exports = function createSsdpAdvert (server, callback) {
  server.log([DEBUG, CONTEXT], 'Creating ssdp advert with USN', USN)

  var bus = ssdp()
  bus.on('error', server.log.bind(server, [ERROR, CONTEXT]))

  bus.advertise({
    usn: USN,
    location: {
      udp4: 'http://' + os.hostname() + ':8000/ssdp/details.xml'
    },
    details: {
      URLBase: 'https://' + os.hostname() + ':8001'
    }
  }, function (error, advert) {
    server.route({
      method: 'GET',
      path: '/ssdp/details.xml',
      handler: function hapiHandler (request, reply) {
        advert.service.details(function (error, details) {
          reply(error, details)
            .type('text/xml')
        })
      },
      config: {
        auth: false
      }
    })

    callback(error, server)
  })
}
