'use strict'

const async = require('async')
const cluster = require('cluster')
const takeHeapSnapshot = require('../../worker/rpc/take-heap-snapshot')
const daemon = require('../daemon')
const path = require('path')
const crypto = require('crypto')

module.exports = function (callback) {
  daemon('process:snapshot:start')

  const location = path.join(process.cwd(), `heap-${Date.now()}`)
  const workers = cluster.workers

  async.parallel({
    master: takeHeapSnapshot.bind(null, `${location}-master.heapsnapshot`),
    workers: async.parallel.bind(async, Object.keys(workers)
      .map(function (key) {
        return workers[key]
      })
      .map(function (worker) {
        return function (next) {
          if (!worker.rpc) {
            return next()
          }

          worker.rpc.takeHeapSnapshot(`${location}-worker-${worker.id$}.heapsnapshot`, next)
        }
      }
    ))
  }, function (error, results) {
    if (!error) {
      results = [results.master].concat(results.workers).map(function (snapshot) {
        snapshot.id = crypto.createHash('md5').update(snapshot.path).digest('hex')

        return snapshot
      })
    }

    if (error) {
      daemon('process:snapshot:error', error)
    } else {
      daemon('process:snapshot:complete', results)
    }

    callback(error, results)
  })
}
