var async = require('async')
var bus = require('../lib/event-bus')
var uncaughtException = require('./events/uncaught-exception')

module.exports = function registerEventListeners (server, callback) {
  async.parallel([
    uncaughtException.bind(null, server, bus)
  ], function (error) {
    callback(error, server)
  })
}
