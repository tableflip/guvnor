'use strict'

const cluster = require('cluster')
const takeHeapSnapshot = require('../../worker/rpc/take-heap-snapshot')
const daemon = require('../daemon')
const path = require('path')
const config = require('../../config')

const PROCESS_NAME = process.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`]

const takeHeapSnapshotMaster = () => {
  daemon('process:snapshot:start')

  const location = path.join(process.cwd(), `${PROCESS_NAME}-heap-${Date.now()}`)
  const workers = cluster.workers

  return Promise.all([
    takeHeapSnapshot(`${location}-master.heapsnapshot`)
  ].concat(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !!worker.rpc)
    .map(worker => worker.rpc.takeHeapSnapshot(`${location}-worker-${worker.id}.heapsnapshot`))
  ))
  .then(snapshots => {
    daemon('process:snapshot:complete', snapshots)

    return snapshots
  })
  .catch(error => {
    daemon('process:snapshot:error', error)

    throw error
  })
}

module.exports = takeHeapSnapshotMaster
