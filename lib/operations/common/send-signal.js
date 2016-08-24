'use strict'

const connectToProcess = require('./lib/connect-to-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-signal'

const sendSignal = (context, name, signal, kill, worker) => {
  context.log([INFO, CONTEXT], `Sending signal ${signal} to ${name} with kill ${kill} and worker ${worker}`)

  return operations.findProcess(context, name)
  .then(proc => connectToProcess(context, proc))
  .then(remote => {
    return remote.sendSignal(signal, kill, worker)
    .then(() => remote.disconnect())
    .catch((error) => {
      remote.disconnect()
      throw error
    })
  })
}

module.exports = sendSignal
