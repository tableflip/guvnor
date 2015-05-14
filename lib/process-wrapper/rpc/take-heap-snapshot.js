var async = require('async')
var fs = require('fs')
var heapdump = require('heapdump')
var parentProcess = require('../parent-process')
var heapSnapshots = require('./heap-snapshots')

module.exports = function takeHeapSnapshot (callback) {
  parentProcess('process:heapdump:start')
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
      parentProcess('process:heapdump:error', error)
    } else {
      heapSnapshots[heapSnapshot.id] = heapSnapshot

      parentProcess('process:heapdump:complete', heapSnapshot)
    }

    if (callback) {
      callback(error, heapSnapshot)
    }
  })
}
