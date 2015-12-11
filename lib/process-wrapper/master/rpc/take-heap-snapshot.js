var async = require('async')
var cluster = require('cluster')
var takeHeapSnapshot = require('../../worker/rpc/take-heap-snapshot')
var daemon = require('../daemon')
var path = require('path')

module.exports = function (callback) {
  daemon('process:snapshot:start')

  var location = path.join(process.cwd(), 'heap-' + Date.now())
  var workers = cluster.workers

  async.parallel({
    master: takeHeapSnapshot.bind(null, location + '-master.heapsnapshot'),
    workers: async.parallel.bind(async, Object.keys(workers)
      .map(function (key) {
        return workers[key]
      })
      .map(function (worker) {
        return function (next) {
          if (!worker.rpc) {
            return next()
          }

          worker.rpc.takeHeapSnapshot(location + '-worker-' + worker.id + '.heapsnapshot', next)
        }
      }
    ))
  }, function (error, results) {
    if (error) {
      daemon('process:snapshot:error', error)
    } else {
      daemon('process:snapshot:complete', results)
    }

    callback(error, results)
  })
}
