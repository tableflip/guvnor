var fs = require('fs')
var through2 = require('through2')
var listHeapSnapshots = require('./list-heap-snapshots')

module.exports = function fetchHeapSnapshot (id, onDetails, onData, callback) {
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

    onDetails(snapshot)

    // create a readable stream of the snapshot file
    var stream = fs.createReadStream(snapshot.path)
    stream.pipe(through2(function (chunk, enc, next) {
      onData(chunk.toString('base64'))

      next()
    }))
    stream.on('end', callback)
  })
}
