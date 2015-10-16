var logger = require('winston')

module.exports = function startServer (server, callback) {
  logger.debug('Starting server')

  server.start(function () {
    callback()
  })
}
