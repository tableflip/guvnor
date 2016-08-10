'use strict'

const cluster = require('cluster')
const os = require('os')
const config = require('../config')

const CPUS = os.cpus()
const GRACE_PERIOD = 5000

module.exports = function updateWorkers (instances, callback) {
  instances = instances || Number(process.env[`${config.DAEMON_ENV_NAME}_INSTANCES`]) || CPUS.length

  if (instances > CPUS.length) {
    instances = CPUS.length
  }

  const workerKeys = Object.keys(cluster.workers)
  const numWorkers = workerKeys.length

  if (instances > numWorkers) {
    for (let i = 0; i < instances - numWorkers; i++) {
      cluster.fork()
    }
  }

  if (instances < numWorkers) {
    for (let n = 0; n < numWorkers - instances; n++) {
      const doomed = cluster.workers[workerKeys.pop()]
      doomed.doomed = true

      doomed.kill('SIGTERM')

      setTimeout(doomed.kill.bind(doomed), GRACE_PERIOD)
        .unref()
    }
  }

  if (callback) {
    callback()
  }
}
