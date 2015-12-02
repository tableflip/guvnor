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
  }, callback)
}
