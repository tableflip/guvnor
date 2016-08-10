'use strict'

const async = require('async')
const bus = require('../lib/event-bus')
const uncaughtException = require('./events/uncaught-exception')

module.exports = function registerEventListeners (server, callback) {
  async.parallel([
    uncaughtException.bind(null, server, bus)
  ], function (error) {
    callback(error, server)
  })
}
