'use strict'

const cluster = require('cluster')

const sendSignalMaster = (signal) => {
  const workers = cluster.workers

  return Promise.all(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !!worker.kill)
    .map(worker => new Promise((resolve, reject) => {
      worker.kill(signal)
      resolve()
    }))
  )
}

module.exports = sendSignalMaster
