'use strict'

module.exports = function write (string, callback) {
  process.master.event('process:stdin:write', string)

  if (callback) process.nextTick(callback)
}
