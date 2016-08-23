'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:list-heap-snapshots'

const listHeapSnapshots = (context, name) => {
  context.log([INFO, CONTEXT], `Listing snapshots for ${name}`)

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
