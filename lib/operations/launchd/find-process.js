var async = require('async')
var loadPlist = require('./lib/load-plist')
var allProcesses = require('./lib/all-processes')
var PROCESS_STATUS = require('../../common/process-status')
var config = require('./config')

function findProcessStatus (name, callback) {
  allProcesses(function (error, processes) {
    if (error) {
      return callback(error)
    }

    var proc = processes.filter(function (proc) {
      return proc.name === name
    }).pop()

    if (!proc) {
      return callback(null, PROCESS_STATUS.STOPPED)
    }

    var status = PROCESS_STATUS.UNKNOWN

    if (proc.pid === 0) {
      status = PROCESS_STATUS.STOPPED
    }

    if (proc.exitCode < 0) {
      status = PROCESS_STATUS.ERROR
    }

    if (proc.pid > 0) {
      status = PROCESS_STATUS.RUNNING
    }

    callback(null, status)
  })
}

function convertPlistToProcess (plist, callback) {
  async.waterfall([
    function (next) {
      findProcessStatus(plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_PROCESS_NAME'], function (error, status) {
        plist.status = status
        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      var proc = {
        name: plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_PROCESS_NAME'],
        script: plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_SCRIPT'],
        status: plist.status,
        socket: plist.EnvironmentVariables[config.DAEMON_ENV_NAME + '_RPC_SOCKET']
      }

      next(null, proc)
    }
  ], callback)
}

module.exports = function launchdFindProcess (context, name, callback) {
  async.waterfall([
    function (next) {
      loadPlist(name, function (error, plist) {
        if (error && error.code === 'ENOENT') {
          error.code = 'ENOPROC'
        }

        next(error, plist)
      })
    },
    convertPlistToProcess
  ], callback)
}
