var async = require('async')
var connectToProcess = require('./connect-to-process')
var operations = require('../../')
var PROCESS_STATUS = require('../../../common/process-status')
var DEBUG = require('good-enough').DEBUG
var WARN = require('good-enough').WARN
var CONTEXT = 'operations:common:lib:report-process-status'

function unique (array) {
  var output = {}

  array.forEach(function (item) {
    output[item] = true
  })

  return Object.keys(output)
}

module.exports = function findProcessStatus (context, proc, callback) {
  if (proc.status !== PROCESS_STATUS.RUNNING) {
    return callback(null, proc)
  }

  connectToProcess(context, proc, function (error, remote, disconnect) {
    if (error) {
      context.log([WARN, CONTEXT], 'Error connecting to process ' + proc.name)
      context.log([WARN, CONTEXT], error)

      if (error.code === 'ENOENT') {
        // could not find socket
        error = null
        proc.status = 'unknown'
      } else if (error.code === 'ECONNREFUSED') {
        // socket is closed
        error = null
        proc.status = 'stopped'
      }

      return callback(error, proc)
    }

    remote.reportStatus(function (error, results) {
      disconnect()

      if (error) {
        if (typeof error === 'string' || error instanceof String) {
          error = new Error(error.trim())
        }

        context.log([WARN, CONTEXT], 'Error reporting status for process ' + proc.name)
        context.log([WARN, CONTEXT], error)

        proc.status = 'error'

        return callback(error, proc)
      }

      context.log([DEBUG, CONTEXT], 'reported status ' + JSON.stringify(results))

      var status = 'running'

      var uids = unique([results.master.uid].concat(results.workers.map(function (worker) {
        return worker.uid
      })))

      var gids = unique([results.master.gid].concat(results.workers.map(function (worker) {
        return worker.gid
      })))

      async.parallel({
        users: function (next) {
          var tasks = {}

          uids.forEach(function (uid) {
            tasks[uid] = operations.findUserDetails.bind(null, context, uid)
          })

          async.parallel(tasks, next)
        },
        groups: function (next) {
          var tasks = {}

          gids.forEach(function (gid) {
            tasks[gid] = operations.findGroupDetails.bind(null, context, gid)
          })

          async.parallel(tasks, next)
        }
      }, function (error, info) {
        if (!error) {
          results.master.user = info.users[results.master.uid].name
          results.master.group = info.groups[results.master.gid].name

          results.workers.forEach(function (worker) {
            worker.user = info.users[worker.uid].name
            worker.group = info.groups[worker.gid].name
          })

          proc.status = status
          proc.master = results.master
          proc.workers = results.workers
        }

        callback(error, proc)
      })
    })
  })
}
