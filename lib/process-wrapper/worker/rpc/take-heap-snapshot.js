var heapdump = require('heapdump')

module.exports = function takeHeapSnapshot (path, callback) {
  heapdump.writeSnapshot(path, callback)
}
