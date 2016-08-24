'use strict'

const cluster = require('cluster')

const sendEventMaster = (event, args) => {
  const workers = cluster.workers

  return Promise.all(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !!worker.rpc)
    .map(worker => worker.rpc.sendEvent(event, args))
  )
}

module.exports = sendEventMaster
