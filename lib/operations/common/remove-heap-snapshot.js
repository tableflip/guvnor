'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:remove-heap-snapshot'

const removeHeapSnapshot = (context, name, id) => {
  context.log([INFO, CONTEXT], `Removing snapshot ${id} for ${name}`)

  return withRemote(context, name, remote => remote.removeHeapSnapshot(id))
}

module.exports = removeHeapSnapshot
