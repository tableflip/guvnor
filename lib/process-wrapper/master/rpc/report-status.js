'use strict'

const async = require('async')
const cluster = require('cluster')
const reportStatus = require('../../worker/rpc/report-status')

module.exports = function (callback) {
  const workers = cluster.workers

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
