'use strict'

const async = require('async')
const cluster = require('cluster')
const forceGc = require('../../worker/rpc/force-gc')
const daemon = require('../daemon')

module.exports = function (callback) {
  daemon('process:gc:start')

  const workers = cluster.workers

  async.parallel({
    master: forceGc,
    workers: async.parallel.bind(async, Object.keys(workers)
      .map(function (key) {
        return workers[key]
      })
      .map(function (worker) {
        return function (next) {
          if (!worker.rpc) {
            return next()
          }

          worker.rpc.forceGc(next)
        }
      }
    ))
  }, function (error) {
    daemon('process:gc:complete')

    callback(error)
  })
}
