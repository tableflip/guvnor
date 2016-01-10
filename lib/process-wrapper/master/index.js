var cluster = require('cluster')
var rpc = require('./rpc')
var workerRpc = require('./worker-rpc')
var updateWorkers = require('./update-workers')
var config = require('../config')

process.title = process.env[config.DAEMON_NAME.toUpperCase() + '_PROCESS_NAME']

process.on('SIGTERM', function () {
  if (process.listeners('SIGTERM').length === 1) {
    process.exit(0)
  }
})

rpc(function (error) {
  if (error) {
    throw error
  }

  // restart any workers that die
  cluster.on('exit', function (worker) {
    if (!worker.doomed) {
      // create a new one, as long as we didn't kill the worker that just died
      cluster.fork()
    }
  })

  cluster.on('online', function (worker) {
    workerRpc(worker)
  })

  updateWorkers()
})
