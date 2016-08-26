'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-signal'

const sendSignal = (context, name, signal, kill, worker) => {
  context.log([INFO, CONTEXT], `Sending signal ${signal} to ${name} with kill ${kill} and worker ${worker}`)

  return withRemote(context, name, remote => remote.sendSignal(signal, kill, worker))
}

module.exports = sendSignal
