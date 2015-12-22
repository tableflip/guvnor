var fs = require('fs')
var daemon = require('../daemon')
var listHeapSnapshots = require('./list-heap-snapshots')

module.exports = function removeHeapSnapshot (id, callback) {
  listHeapSnapshots(function (error, snapshots) {
    if (error) {
      return callback(error)
    }

    var snapshot = snapshots.filter(function (snapshot) {
      return snapshot.id === id
    }).pop()

    if (!snapshot) {
      error = new Error('No snapshot found for ' + id)
      error.code = 'ENOHEAP'

      return callback(error)
    }

    fs.unlink(snapshot.path, function removedHeapSnapshot () {
      daemon('process:heapdump:removed', snapshot)
      callback()
    })
  })
}
