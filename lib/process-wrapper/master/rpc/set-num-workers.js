'use strict'

const cluster = require('cluster')
const os = require('os')
const config = require('../../config')
const daemon = require('./../daemon')
const workerRpc = require('../worker-rpc')

const CPUS = os.cpus()
const GRACE_PERIOD = 5000

// restart any workers that die
cluster.on('exit', function (worker) {
  daemon('process:worker:exit', worker)

  if (!worker.doomed) {
    // create a new one, as long as we didn't kill the worker that just died
    cluster.fork()
  }
})

// notify when we fork a worker
cluster.on('fork', function (worker) {
  daemon('process:worker:fork', worker)
})

// notify when a worker comes online
cluster.on('online', function (worker) {
  workerRpc(worker)

  daemon('process:worker:online', worker)
})

// notify when a worker listens to a port
cluster.on('listening', (worker, address) => {
  daemon('process:worker:listening', worker, address)
})

const updateWorkers = (workers) => {
  return new Promise((resolve, reject) => {
    try {
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

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = updateWorkers
