'use strict'

const parentProcess = require('../parent-process')

module.exports = function signal (signal, callback) {
  parentProcess('process:signal', signal)

  if (callback) process.nextTick(callback)
}
