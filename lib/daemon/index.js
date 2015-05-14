
process.once('uncaughtException', function (error) {
  console.error('Uncaught exception', error.stack ? error.stack : error)
  process.exit(1)
})

function exit () {
  process.exit(0)
}

var logger = require('winston')
logger.cli()
logger.level = 'debug'

var startServer = require('./start-server')

startServer(function startedServer (error) {
  if (error) {
    throw error
  }

  process.once('exit', exit)
  process.once('SIGINT', exit)
  process.once('SIGTERM', exit)

  logger.info('Guvnor is running')

  if (process.send) {
    process.send('ready')
  }
})
