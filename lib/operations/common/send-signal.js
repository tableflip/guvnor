'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-signal'

const sendSignal = (context, name, signal) => {
  context.log([INFO, CONTEXT], `Sending signal ${signal} to ${name}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.sendSignal(signal)
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = sendSignal
