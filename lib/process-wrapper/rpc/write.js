var parentProcess = require('../parent-process')

module.exports = function write (string, callback) {
  parentProcess('process:stdin:write', string)

  if (callback) process.nextTick(callback)
}
