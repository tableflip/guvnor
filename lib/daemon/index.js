
process.once('uncaughtException', function (error) {
  console.error('Uncaught exception', error.stack ? error.stack : error)
  process.exit(1)
})

function exit () {
  process.exit(0)
}

var startServer = require('./start-server')

startServer(function startedServer (error) {
  if (error) {
    throw error
  }

  process.once('exit', exit)
  process.once('SIGINT', exit)
  process.once('SIGTERM', exit)

  if (process.send) {
    process.send('ready')
  }
})
