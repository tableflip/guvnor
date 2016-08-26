'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:force-gc'

const forceGc = (context, name) => {
  context.log([INFO, CONTEXT], `Forcing gc for ${name}`)

  return withRemote(context, name, remote => remote.forceGc())
}

module.exports = forceGc
