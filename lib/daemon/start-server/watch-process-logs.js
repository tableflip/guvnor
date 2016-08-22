'use strict'

const operations = require('../../operations')
const context = require('../lib/global-context')

const watchProcessLogs = (context) => {
  return operations.watchProcessLogs(context)
}

module.exports = watchProcessLogs
