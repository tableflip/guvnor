'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-event'

const sendEvent = (context, name, event, args) => {
  context.log([INFO, CONTEXT], `Sending event ${event} to ${name} with args ${args}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.sendEvent(event, args)
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = sendEvent
