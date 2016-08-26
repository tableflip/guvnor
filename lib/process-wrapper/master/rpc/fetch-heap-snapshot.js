'use strict'

const fs = require('fs-promise')
const through2 = require('through2')
const listHeapSnapshots = require('./list-heap-snapshots')

const fetchHeapSnapshot = (id, onDetails, onData) => {
  return listHeapSnapshots()
  .then(snapshots => snapshots.find(snapshot => snapshot.id === id))
  .then(snapshot => {
    if (!snapshot) {
      const error = new Error(`No snapshot found for ${id}`)
      error.code = 'ENOHEAP'

      throw error
    }

    return snapshot
  })
  .then(snapshot => {
    onDetails(snapshot)

    return new Promise((resolve, reject) => {
      // create a readable stream of the snapshot file
      const stream = fs.createReadStream(snapshot.path)
      stream.pipe(through2((chunk, enc, next) => {
        onData(chunk.toString('base64'))

        next()
      }))
      stream.on('end', resolve)
      stream.on('error', reject)
    })
  })
}

module.exports = fetchHeapSnapshot
