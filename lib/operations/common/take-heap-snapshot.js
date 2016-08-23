'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:take-heap-snapshots'

const takeHeapSnapshot = (context, name) => {
  context.log([INFO, CONTEXT], `Taking snapshot for ${name}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.takeHeapSnapshot()
    .then((snapshot) => {
      remote.disconnect()

      return snapshot
    })
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = takeHeapSnapshot
