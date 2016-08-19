'use strict'

const bus = require('../lib/event-bus')
const uncaughtException = require('./events/uncaught-exception')
const unhandledRejection = require('./events/unhandled-rejection')

const registerEventListeners = (server) => {
  uncaughtException(server, bus)
  unhandledRejection(server, bus)

  return Promise.resolve(server)
}

module.exports = registerEventListeners
