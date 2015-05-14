var parentProcess = require('../parent-process')

module.exports = function forceGc (callback) {
  parentProcess('process:gc:start')

  if (global && typeof global.gc === 'function') {
    global.gc()
  }

  parentProcess('process:gc:complete')

  if (callback) process.nextTick(callback)
}
