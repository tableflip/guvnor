'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:send-event'

const sendEvent = (context, name, event, args, worker) => {
  context.log([INFO, CONTEXT], `Sending event ${event} to ${name} with args ${args} and worker ${worker}`)

  return withRemote(context, name, remote => remote.sendEvent(event, args, worker))
}

module.exports = sendEvent
