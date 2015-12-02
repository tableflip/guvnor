
module.exports = function forceGc (callback) {
  process.master.event('process:gc:start')

  if (global && typeof global.gc === 'function') {
    global.gc()
  }

  process.master.event('process:gc:complete')

  if (callback) process.nextTick(callback)
}
