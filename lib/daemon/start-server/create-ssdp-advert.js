'use strict'

const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'daemon:start-server:create-ssdp-advert'
const USN = require('../../common/ssdp-usn')
const ssdp = require('@achingbrain/ssdp')
const config = require('../config')

const createSsdpAdvert = (context, server) => {
  context.log([DEBUG, CONTEXT], `Creating ssdp advert with USN ${USN}`)

  const bus = ssdp()
  bus.on('error', error => {
    server.log([WARN, CONTEXT], `SSDP error: ${error.message}`)
  })

  return bus.advertise({
    usn: USN,
    location: {
      udp4: `http://${config.HTTP_HOST}:${config.HTTP_PORT}/ssdp/details.xml`
    },
    details: {
      URLBase: `https://${config.HTTPS_HOST}:${config.HTTPS_PORT}`
    }
  })
  .then(advert => {
    server.select('http').route({
      method: 'GET',
      path: '/ssdp/details.xml',
      handler: (request, reply) => {
        reply(advert.service.details())
          .type('text/xml')
      },
      config: {
        auth: false
      }
    })
  })
  .catch(error => context.log([WARN, CONTEXT], `Could not create SSDP advert ${error.stack}`))
  .then(() => server)
}

module.exports = createSsdpAdvert
