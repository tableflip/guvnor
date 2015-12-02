var cluster = require('cluster')
var os = require('os')
var workerRpc = require('./worker-rpc')

var CPUS = os.cpus()
var GRACE_PERIOD = 5000

module.exports = function updateWorkers (instances) {
  instances = instances || Number(process.env.GUVNOR_INSTANCES) || CPUS.length

  if (instances > CPUS.length) {
    instances = CPUS.length
  }

  var workerKeys = Object.keys(cluster.workers)
  var numWorkers = workerKeys.length

  if (instances > numWorkers) {
    for (var i = 0; i < instances - numWorkers; i++) {
      var worker = cluster.fork()

      workerRpc(worker)
    }
  }

  if (instances < numWorkers) {
    for (var n = 0; n < numWorkers - instances; n++) {
      var doomed = cluster.workers[workerKeys.pop()]
      doomed.doomed = true

      doomed.kill('SIGTERM')

      setTimeout(doomed.kill.bind(doomed), GRACE_PERIOD)
        .unref()
    }
  }
}
