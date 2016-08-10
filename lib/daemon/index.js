'use strict'

process.once('uncaughtException', function (error) {
  console.error('Uncaught exception', error.stack ? error.stack : error)
  process.exit(1)
})

const exit = () => {
  process.exit(0)
}

const startServer = require('./start-server')

const startedServer = (error) => {
  if (error) {
    throw error
  }

  process.once('exit', exit)
  process.once('SIGINT', exit)
  process.once('SIGTERM', exit)

  if (process.send) {
    process.send('ready')
  }
}

startServer(startedServer)
