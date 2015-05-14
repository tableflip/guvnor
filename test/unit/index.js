var logger = require('winston')
var util = require('util')
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach

process.setMaxListeners(0)

var NullLogger = function () {
  this.name = 'console'
}
util.inherits(NullLogger, logger.Transport)

NullLogger.prototype.log = function (level, msg, meta, callback) {
  callback(null, true)
}

logger.remove(logger.transports.Console)
logger.add(NullLogger, {})

var testLog = []

var TestLogger = function () {
  this.name = 'test'

  this.level = 'debug'
}
util.inherits(TestLogger, logger.Transport)

TestLogger.prototype.log = function (level, msg, meta, callback) {
  testLog.push({
    level: level,
    msg: msg,
    meta: meta
  })

  callback(null, true)
}

logger.add(TestLogger, {})
logger.level = 'debug'

beforeEach(function () {
  testLog = []
})

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    if (testLog.length === 0) {
      return
    }

    console.error('')
    console.error('---------------------')
    console.error('')
    console.error('Failed test output:')
    console.error('')
    testLog.forEach(function (log) {
      console.error('%s: %s', log.level, log.msg)
    })
    console.error('')
    console.error('---------------------')
    console.error('')
  }
})
