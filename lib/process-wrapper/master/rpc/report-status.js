'use strict'

const cluster = require('cluster')
const reportStatus = require('../../worker/rpc/report-status')

const reportClusterStatus = () => {
  const workers = cluster.workers

  return reportStatus()
  .then(masterStatus => {
    return Promise.all(
      Object.keys(workers)
      .map(key => workers[key])
      .filter(worker => !!worker.rpc)
      .map(worker => worker.rpc.reportStatus())
    )
    .then(workerStatuses => {
      return {
        master: masterStatus,
        workers: workerStatuses
      }
    })
  })
}

module.exports = reportClusterStatus
