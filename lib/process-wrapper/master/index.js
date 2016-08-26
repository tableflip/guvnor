'use strict'

const rpc = require('./rpc')
const config = require('../config')
const daemon = require('./daemon')
const setNumWorkers = require('./rpc/set-num-workers')

process.title = process.env[`${config.DAEMON_NAME.toUpperCase()}_PROCESS_NAME`]

process.on('SIGTERM', function () {
  if (process.listeners('SIGTERM').length === 1) {
    process.exit(0)
  }
})

process.on('uncaughtException', (error) => {
  console.info(error.stack)
  try {
    daemon.sync('process:master:uncaught-exception', {
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    })

    if (process.listeners('uncaughtException').length === 1) {
      process.exit(1)
    }
  } catch (error) {
    console.info(error.stack)
  }
})

process.on('unhandledRejection', (error) => {
  console.info(error.stack)
  try {
    daemon.sync('process:master:unhandled-rejection', {
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    })

    if (process.listeners('unhandledRejection').length === 1) {
      process.exit(1)
    }
  } catch (error) {
    console.info(error.stack)
  }
})

rpc()
.then(() => setNumWorkers())
