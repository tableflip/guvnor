var fs = require('fs')
var heapSnapshots = require('./heap-snapshots')

module.exports = function removeHeapSnapshot (id, callback) {
  var heapSnapshot = heapSnapshots[id]

  if (!heapSnapshot) {
    process.master.event('process:heapdump:removed', {
      id: id
    })

    return callback()
  }

  fs.unlink(heapSnapshot.path, function removedHeapSnapshot () {
    process.master.event('process:heapdump:removed', heapSnapshot)
    delete heapSnapshots[id]
    callback()
  })
}
