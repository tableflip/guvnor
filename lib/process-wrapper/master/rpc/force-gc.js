'use strict'

const cluster = require('cluster')
const forceGc = require('../../worker/rpc/force-gc')
const daemon = require('../daemon')

const forceGcMaster = () => {
  daemon('process:gc:start')

  const workers = cluster.workers

  return forceGc()
  .then(() => Promise.all(
    Object.keys(workers)
    .map(key => workers[key])
    .filter(worker => !!worker.rpc)
    .map(worker => worker.rpc.forceGc())
  ))
  .then(() => {
    daemon('process:gc:complete')
  })
  .catch(error => {
    daemon('process:gc:error', error)
  })
}

module.exports = forceGcMaster
