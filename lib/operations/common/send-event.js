'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-event'

const sendEvent = (context, name, event, args, worker) => {
  context.log([INFO, CONTEXT], `Sending event ${event} to ${name} with args ${args} and worker ${worker}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.sendEvent(event, args, worker)
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = sendEvent
