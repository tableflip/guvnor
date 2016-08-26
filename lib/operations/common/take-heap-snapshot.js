'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:take-heap-snapshots'

const takeHeapSnapshot = (context, name) => {
  context.log([INFO, CONTEXT], `Taking snapshot for ${name}`)

  return withRemote(context, name, remote => remote.takeHeapSnapshot())
}

module.exports = takeHeapSnapshot
