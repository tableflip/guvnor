var logger = require('winston')
var USN = require('../../common/ssdp-usn')
var ssdp = require('@achingbrain/ssdp')
var bus = ssdp()

// print error messages to the console
bus.on('error', logger.error)

module.exports = function createSsdpAdvert (server, callback) {
  logger.debug('Creating ssdp advert with USN', USN)

  bus.advertise({
    usn: USN,
    hapi: server
  })

  callback(null, server)
}
