var async = require('async')
var fs = require('fs')
var heapdump = require('heapdump')
var heapSnapshots = require('./heap-snapshots')

module.exports = function takeHeapSnapshot (callback) {
  process.master.event('process:heapdump:start')
  var here = process.cwd()

  async.waterfall([
    heapdump.writeSnapshot.bind(heapdump),
    function writtenHeapSnapshot (fileName, callback) {
      var heapSnapshot = {
        id: fileName,
        date: Date.now(),
        path: here + '/' + fileName
      }

      // only the filename is passed, not the whole path :(
      // https://github.com/bnoordhuis/node-heapdump/issues/42
      fs.stat(heapSnapshot.path, function (error, stats) {
        if (!error) {
          heapSnapshot.size = stats.size
        }

        callback(error, heapSnapshot)
      })
    }
  ], function afterWrittenHeapSnapshot (error, heapSnapshot) {
    if (error) {
      process.master.event('process:heapdump:error', error)
    } else {
      heapSnapshots[heapSnapshot.id] = heapSnapshot

      process.master.event('process:heapdump:complete', heapSnapshot)
    }

    if (callback) {
      callback(error, heapSnapshot)
    }
  })
}
