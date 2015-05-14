var fs = require('fs')
var parentProcess = require('../parent-process')
var heapSnapshots = require('./heap-snapshots')

module.exports = function removeHeapSnapshot (id, callback) {
  var heapSnapshot = heapSnapshots[id]

  if (!heapSnapshot) {
    parentProcess('process:heapdump:removed', {
      id: id
    })

    return callback()
  }

  fs.unlink(heapSnapshot.path, function removedHeapSnapshot () {
    parentProcess('process:heapdump:removed', heapSnapshot)
    delete heapSnapshots[id]
    callback()
  })
}
