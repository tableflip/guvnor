'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')

const fetchHeapSnapshot = (context, name, id, onDetails, onData) => {
  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.fetchHeapSnapshot(id, onDetails, (data) => {
      onData(new Buffer(data, 'base64'))
    })
    .then(() => {
      remote.disconnect()
    })
    .catch(error => {
      remote.disconnect()

      const err = new Error(error.message)

      for (const key in error) {
        err[key] = error[key]
      }

      error = err

      throw err
    })
  })
}

module.exports = fetchHeapSnapshot
