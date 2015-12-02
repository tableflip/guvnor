var fs = require('fs')
var heapSnapshots = require('./heap-snapshots')

module.exports = function fetchHeapSnapshot (id, onReadable, onData, onEnd, callback) {
  var heapSnapshot = heapSnapshots[id]

  if (!heapSnapshot) {
    var error = new Error('No snapshot for ' + id + ' available')
    error.code = 'ENOENT'

    return callback(error)
  }

  // create a readable stream of the snapshot file
  var stream = fs.createReadStream(heapSnapshot.path)
  stream.on('end', onEnd)
  stream.on('readable', onReadable)

  var read = function () {
    var buf = stream.read()

    if (!buf) {
      return
    }

    onData(buf.toString('base64'))
  }

  callback(undefined, heapSnapshot, read)
}
