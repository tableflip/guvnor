'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:force-gc'

const forceGc = (context, name) => {
  context.log([INFO, CONTEXT], `Forcing gc for ${name}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.forceGc()
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = forceGc
