var Autowire = require('wantsit').Autowire
var ProcessRPC = require('../process/ProcessRPC')
var util = require('util')
var async = require('async')

var ClusterManagerRPC = function () {
  ProcessRPC.call(this)

  this._clusterManager = Autowire
  this._os = Autowire
}
util.inherits(ClusterManagerRPC, ProcessRPC)

ClusterManagerRPC.prototype.reportStatus = function (callback) {
  ProcessRPC.prototype.reportStatus.call(this, function (error, status) {
    if (error) {
      return callback(error)
    }

    status = status || {}
    status.cluster = true
    status.workers = []

    async.parallel(this._clusterManager.workers.map(function (worker) {
      return function (callback) {
        if (!worker.remote) {
          return callback(undefined, {
            id: worker.id,
            restarts: worker.totalRestarts,
            status: worker.status,
            script: worker.script,
            debugPort: worker.debugPort
          })
        }

        return worker.remote.reportStatus(function (error, status) {
          status = status || {}
          status.restarts = worker.totalRestarts
          status.id = worker.id
          status.status = worker.status
          status.script = worker.script
          status.debugPort = worker.debugPort

          if (error && error.code === 'TIMEOUT') {
            // this worker timed out, return basic information so other workers have a chance to reply,
            // otherwise the whole call will fail
            error = null
          }

          return callback(error, status)
        })
      }
    }), function (error, result) {
      status.workers = result

      callback(error, status)
    })
  }.bind(this))
}

ClusterManagerRPC.prototype.setClusterWorkers = function (workers, callback) {
  workers = parseInt(workers, 10)

  if (isNaN(workers)) {
    return callback(new Error('Invalid number of workers'))
  }

  if (workers < 1) {
    return callback(new Error('A cluster must have at least one worker'))
  }

  var maxWorkers = this._os.cpus().length

  if (workers > maxWorkers) {
    return callback(new Error('A cluster cannot have more workers than CPUs'))
  }

  this._clusterManager.setNumWorkers(workers, callback)
}

module.exports = ClusterManagerRPC
