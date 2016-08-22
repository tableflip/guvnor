'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')

const setNumWorkers = (context, name, workers) => {
  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.setNumWorkers(workers)
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = setNumWorkers
