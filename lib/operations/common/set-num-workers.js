'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:set-num-workers'

const setNumWorkers = (context, name, workers) => {
  context.log([INFO, CONTEXT], `Setting ${name} workers to ${workers}`)

  return withRemote(context, name, remote => remote.setNumWorkers(workers))
}

module.exports = setNumWorkers
