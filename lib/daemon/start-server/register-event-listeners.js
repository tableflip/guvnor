'use strict'

const bus = require('../lib/event-bus')
const uncaughtException = require('./events/uncaught-exception')

const registerEventListeners = (server) => {
  uncaughtException(server, bus)

  return Promise.resolve(server)
}

module.exports = registerEventListeners
