'use strict'

const cluster = require('cluster')
const os = require('os')
const config = require('../config')

const CPUS = os.cpus()
const GRACE_PERIOD = 5000

module.exports = function updateWorkers (workers, callback) {
  workers = workers || Number(process.env[`${config.DAEMON_ENV_NAME}_WORKERS`]) || CPUS.length

  if (workers > CPUS.length) {
    workers = CPUS.length
  }

  const workerKeys = Object.keys(cluster.workers)
  const numWorkers = workerKeys.length

  if (workers > numWorkers) {
    for (let i = 0; i < workers - numWorkers; i++) {
      cluster.fork()
    }
  }

  if (workers < numWorkers) {
    for (let n = 0; n < numWorkers - workers; n++) {
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
