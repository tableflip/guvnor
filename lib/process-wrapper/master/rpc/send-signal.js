'use strict'

const cluster = require('cluster')

const sendSignalMaster = (signal, kill, workerId) => {
  const workers = cluster.workers

  return Promise.all(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !workerId || worker.id === workerId)
    .filter(worker => !kill || !!worker.rpc)
    .map(worker => new Promise((resolve, reject) => {
      if (kill) {
        try {
          worker.kill(signal)
          return resolve()
        } catch (error) {
          return reject(error)
        }
      }

      worker.rpc.sendEvent(signal)
      .then(resolve)
      .catch(reject)
    }))
  )
  .then(() => {})
}

module.exports = sendSignalMaster
