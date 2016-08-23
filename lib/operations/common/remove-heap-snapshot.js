'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:remove-heap-snapshot'

const removeHeapSnapshot = (context, name, id) => {
  context.log([INFO, CONTEXT], `Removing snapshot ${id} for ${name}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.removeHeapSnapshot(id)
    .then(() => {
      remote.disconnect()
    })
    .catch(error => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = removeHeapSnapshot
