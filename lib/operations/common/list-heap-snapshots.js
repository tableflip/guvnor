'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:list-heap-snapshots'

const listHeapSnapshots = (context, name) => {
  context.log([INFO, CONTEXT], `Listing snapshots for ${name}`)

  return withRemote(context, name, remote => remote.listHeapSnapshots())
}

module.exports = listHeapSnapshots
