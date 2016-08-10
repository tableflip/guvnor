'use strict'

const fs = require('fs')
const through2 = require('through2')
const listHeapSnapshots = require('./list-heap-snapshots')

module.exports = function fetchHeapSnapshot (id, onDetails, onData, callback) {
  listHeapSnapshots(function (error, snapshots) {
    if (error) {
      return callback(error)
    }

    const snapshot = snapshots.filter(function (snapshot) {
      return snapshot.id === id
    }).pop()

    if (!snapshot) {
      error = new Error('No snapshot found for ' + id)
      error.code = 'ENOHEAP'

      return callback(error)
    }

    onDetails(snapshot)

    // create a readable stream of the snapshot file
    const stream = fs.createReadStream(snapshot.path)
    stream.pipe(through2(function (chunk, enc, next) {
      onData(chunk.toString('base64'))

      next()
    }))
    stream.on('end', callback)
  })
}
