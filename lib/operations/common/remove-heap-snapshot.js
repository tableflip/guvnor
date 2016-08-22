'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')

const removeHeapSnapshot = (context, name, id) => {
  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.removeHeapSnapshot(id)
    .then(snapshot => {
      remote.disconnect()
      return snapshot
    })
    .catch(error => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = removeHeapSnapshot
