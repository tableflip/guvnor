'use strict'

process.on('uncaughtException', function (error) {
  process.master.event('process:uncaught-exception', {
    date: Date.now(),
    message: error.message,
    code: error.code,
    stack: error.stack
  })

  if (process.listeners('uncaughtException').length === 1) {
    process.exit(1)
  }
})

const async = require('async')
const config = require('../config')
const rpc = require('./rpc')

const script = process.env[`${config.DAEMON_ENV_NAME}_SCRIPT`]

function setProcessName (callback) {
  process.title = process.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`]

  callback()
}

function removePropertiesFromEnvironment (callback) {
  // remove our properties
  for (const key in process.env) {
    if (key.substr(0, config.DAEMON_ENV_NAME.length) === config.DAEMON_ENV_NAME) {
      delete process.env[key]
    }
  }

  callback()
}

function startProcess (script, callback) {
  process.nextTick(function () {
    let error

    // this will execute the passed script
    try {
      if (script.substring(script.length - '.coffee'.length) === '.coffee') {
        require('coffee-script/register')
      }

      require(script)
    } catch (e) {
      error = e
    }

    callback(error)
  })
}

async.series({
  name: setProcessName,
  master: rpc,
  props: removePropertiesFromEnvironment
}, function (error, results) {
  if (!error) {
    process.master = results.master
  }

  // this means we failed to start
  if (error) {
    if (process.master) {
      process.master.event('process:failed', {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })
    }

    throw error
  }

  startProcess(script, function (error) {
    // this means the user's module failed to start
    if (error) {
      process.master.event('process:errored', {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      throw error
    }

    // this means all is well
    process.master.event('process:started')
  })
})
