'use strict'

const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:start-server:create-ssdp-advert'
const USN = require('../../common/ssdp-usn')
const ssdp = require('@achingbrain/ssdp')
const os = require('os')
const config = require('../config')

const createSsdpAdvert = (context, server) => {
  context.log([DEBUG, CONTEXT], `Creating ssdp advert with USN ${USN}`)

  return new Promise((resolve, reject) => {
    const bus = ssdp()
    bus.on('error', server.log.bind(server, [ERROR, CONTEXT]))

    bus.advertise({
      usn: USN,
      location: {
        udp4: `http://${config.HTTP_HOST}:${config.HTTP_PORT}/ssdp/details.xml`
      },
      details: {
        URLBase: `https://${config.HTTPS_HOST}:${config.HTTPS_PORT}`
      }
    }, (error, advert) => {
      if (error) {
        return reject(error)
      }

      server.select('http').route({
        method: 'GET',
        path: '/ssdp/details.xml',
        handler: (request, reply) => {
          advert.service.details((error, details) => {
            reply(error, details)
              .type('text/xml')
          })
        },
        config: {
          auth: false
        }
      })

      resolve(server)
    })
  })
}

module.exports = createSsdpAdvert
