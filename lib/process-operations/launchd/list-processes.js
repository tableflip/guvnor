var async = require('async')
var allPlists = require('./all-plists')
var allProcesses = require('./all-processes')
var connectToProcess = require('../common/connect-to-process')
var logger = require('winston')

module.exports = function launchdListProcesses (user, callback) {
  async.auto({
    plists: allPlists,
    processes: allProcesses,
    statuses: ['plists', 'processes', function (next, results) {
      async.parallel(results.plists.map(function (plist) {
        var proc = results.processes.reduce(function findProcess (prev, current) {
          if (prev) {
            return prev
          }

          if (current.name === plist.Label) {
            return current
          }
        }, null)

        if (!proc || isNaN(proc.pid)) {
          return function stoppedProcess (done) {
            done(null, {
              name: plist.EnvironmentVariables.GUVNOR_PROCESS_NAME,
              script: plist.EnvironmentVariables.GUVNOR_SCRIPT,
              status: 'stopped',
              user: plist.UserName,
              group: plist.GroupName
            })
          }
        }

        return function runningProcess (done) {
          connectToProcess(user, plist.EnvironmentVariables.GUVNOR_PROCESS_NAME, function (error, proc, disconnect) {
            if (error) {
              logger.warn('Error connecting to process ' + plist.EnvironmentVariables.GUVNOR_PROCESS_NAME)
              logger.warn(error)

              if (error.code === 'ENOENT') {
                // could not find socket
                error = null
              }

              return done(error, {
                name: plist.EnvironmentVariables.GUVNOR_PROCESS_NAME,
                script: plist.EnvironmentVariables.GUVNOR_SCRIPT,
                status: 'unknown',
                user: plist.UserName,
                group: plist.GroupName
              })
            }

            proc.reportStatus(function (error, results) {
              disconnect()

              var status = 'running'

              if (error) {
                if (typeof error === 'string' || error instanceof String) {
                  error = new Error(error.trim())
                }

                logger.warn('Error reporting status for process ' + plist.EnvironmentVariables.GUVNOR_PROCESS_NAME)
                logger.warn(error)

                status = 'error'
              }

              results = results || {}

              done(null, {
                name: results.name || plist.EnvironmentVariables.GUVNOR_PROCESS_NAME,
                script: plist.EnvironmentVariables.GUVNOR_SCRIPT,
                status: status,
                user: plist.UserName,
                group: plist.GroupName
              })
            })
          })
        }
      }), next)
    }]
  }, function (error, results) {
    callback(error, results ? results.statuses : null)
  })
}
