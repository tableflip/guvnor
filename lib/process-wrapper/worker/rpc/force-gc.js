'use strict'

module.exports = function forceGc (callback) {
  if (global && typeof global.gc === 'function') {
    global.gc()
  }

  if (callback) {
    process.nextTick(callback)
  }
}
