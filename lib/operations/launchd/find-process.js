'use strict'

const async = require('async')
const loadPlist = require('./lib/load-plist')
const allProcesses = require('./lib/all-processes')
const PROCESS_STATUS = require('../../common/process-status')
const config = require('./config')

function findProcessStatus (name, callback) {
  allProcesses(function (error, processes) {
    if (error) {
      return callback(error)
    }

    const proc = processes.filter(function (proc) {
      return proc.name === name
    }).pop()

    if (!proc) {
      return callback(null, PROCESS_STATUS.STOPPED)
    }

    let status = PROCESS_STATUS.UNKNOWN

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
      findProcessStatus(plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`], function (error, status) {
        plist.status = status
        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      const proc = {
        name: plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
        script: plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_SCRIPT`],
        status: plist.status,
        socket: plist.Environmentconstiables[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`]
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
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
