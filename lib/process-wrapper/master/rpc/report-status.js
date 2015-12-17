var async = require('async')
var cluster = require('cluster')
var reportStatus = require('../../worker/rpc/report-status')

module.exports = function (callback) {
  var workers = cluster.workers

  async.parallel({
    master: reportStatus,
    workers: async.parallel.bind(async, Object.keys(workers)
      .map(function (key) {
        return workers[key]
      })
      .map(function (worker) {
        return function (next) {
          if (!worker.rpc) {
            return next()
          }

          worker.rpc.reportStatus(next)
        }
      }
    ))
  }, function (error, results) {
    if (!error) {
      results.workers = results.workers.filter(function (status) {
        // if a worker has not initialised, do not report it's status
        return status
      })
    }

    callback(error, results)
  })
}
