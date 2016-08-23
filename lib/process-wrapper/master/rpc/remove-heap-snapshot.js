'use strict'

const fs = require('fs-promise')
const daemon = require('../daemon')
const listHeapSnapshots = require('./list-heap-snapshots')

const removeHeapSnapshot = (id) => {
  return listHeapSnapshots()
  .then(snapshots => snapshots.find(snapshot => snapshot.id === id))
  .then(snapshot => {
    if (!snapshot) {
      const error = new Error(`No snapshot found for ${id}`)
      error.code = 'ENOHEAP'

      throw error
    }

    return fs.unlink(snapshot.path)
  })
  .then(() => {
    daemon('process:snapshot:removed', id)
  })
  .catch(error => {
    daemon('process:snapshot:error', error)

    throw error
  })
}

module.exports = removeHeapSnapshot
