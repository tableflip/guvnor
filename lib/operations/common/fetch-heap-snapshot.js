'use strict'

const withRemote = require('./lib/with-remote')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:fetch-heap-snapshot'

const fetchHeapSnapshot = (context, name, id, onDetails, onData) => {
  context.log([INFO, CONTEXT], `Fetching snapshot ${id} from ${name}`)

  return withRemote(context, name, remote => remote.fetchHeapSnapshot(id, onDetails, (data) => {
    onData(new Buffer(data, 'base64'))
  }))
}

module.exports = fetchHeapSnapshot
