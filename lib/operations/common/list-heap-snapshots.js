'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')

const listHeapSnapshots = (context, name) => {
  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.listHeapSnapshots()
    .then(list => {
      remote.disconnect()
      return list
    })
    .catch(error => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = listHeapSnapshots
