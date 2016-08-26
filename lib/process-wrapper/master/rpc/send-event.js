'use strict'

const cluster = require('cluster')

const sendEventMaster = (event, args, workerId) => {
  const workers = cluster.workers

  return Promise.all(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !workerId || worker.id === workerId)
    .filter(worker => !!worker.rpc)
    .map(worker => worker.rpc.sendEvent(event, args))
  )
  .then(() => {})
}

module.exports = sendEventMaster
