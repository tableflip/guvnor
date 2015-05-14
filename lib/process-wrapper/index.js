var async = require('async')
var rpc = require('./rpc')
var parentProcess = require('./parent-process')

var script = process.env.GUVNOR_SCRIPT

function setProcessName (callback) {
  process.title = process.env.GUVNOR_PROCESS_NAME

  callback()
}

function removePropertiesFromEnvironment (callback) {
  // remove our properties
  for (var key in process.env) {
    if (key.substr(0, 6) === 'GUVNOR') {
      delete process.env[key]
    }
  }

  callback()
}

function startProcess (script, callback) {
  process.nextTick(function () {
    var error

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

async.series([
  setProcessName,
  rpc,
  removePropertiesFromEnvironment
], function (error, results) {
  // this means we failed to start
  if (error) {
    parentProcess('process:failed', {
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    })

    throw error
  }

  startProcess(script, function (error) {
    // this means the user's module failed to start
    if (error) {
      parentProcess('process:errored', {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      throw error
    }

    // this means all is well
    parentProcess('process:started', results[1])
  })
})
