var async = require('async')
var loadPlist = require('./lib/load-plist')
var allProcesses = require('./lib/all-processes')
var PROCESS_STATUS = require('../../common/process-status')

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
      findProcessStatus(plist.EnvironmentVariables.GUVNOR_PROCESS_NAME, function (error, status) {
        plist.status = status
        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      var proc = {
        name: plist.EnvironmentVariables.GUVNOR_PROCESS_NAME,
        script: plist.EnvironmentVariables.GUVNOR_SCRIPT,
        status: plist.status,
        socket: plist.EnvironmentVariables.GUVNOR_RPC_SOCKET
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
