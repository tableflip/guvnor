var cluster = require('cluster')
var rpc = require('./rpc')
var updateWorkers = require('./update-workers')

process.title = process.env.GUVNOR_PROCESS_NAME

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

  updateWorkers()
})
