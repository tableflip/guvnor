'use strict'

process.on('uncaughtException', (error) => {
  process.send({
    event: 'process:uncaught-exception',
    args: [{
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    }]
  })

  if (process.listeners('uncaughtException').length === 1) {
    process.exit(1)
  }
})

process.on('unhandledRejection', (error) => {
  process.send({
    event: 'process:unhandled-rejection',
    args: [{
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    }]
  })

  if (process.listeners('unhandledRejection').length === 1) {
    process.exit(1)
  }
})

const config = require('../config')
const rpc = require('./rpc')

const script = process.env[`${config.DAEMON_ENV_NAME}_SCRIPT`]

const setProcessName = () => {
  return new Promise((resolve, reject) => {
    process.title = process.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`]
    resolve()
  })
}

const removePropertiesFromEnvironment = () => {
  return new Promise((resolve, reject) => {
    // remove our properties
    for (const key in process.env) {
      if (key.substr(0, config.DAEMON_ENV_NAME.length) === config.DAEMON_ENV_NAME) {
        delete process.env[key]
      }
    }

    resolve()
  })
}

const startProcess = (script, callback) => {
  return new Promise((resolve, reject) => {
    try {
      if (script.substring(script.length - '.coffee'.length) === '.coffee') {
        require('coffee-script/register')
      }

      // this will execute the passed script
      require(script)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

setProcessName()
.then(() => rpc())
.then(() => removePropertiesFromEnvironment())
.then(() => startProcess(script))
.then(() => process.send({
  event: 'process:worker:started'
}))
.catch(error => {
  // this means the users' script failed to start
  process.send({
    event: 'process:worker:errored',
    args: [{
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    }]
  })

  throw error
})
