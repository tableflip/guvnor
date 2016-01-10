
var logger = require('winston')
logger.cli()
logger.level = 'debug'

var startServer = require('./start-server')

startServer(function (error) {
  if (error) {
    throw error
  }
})
