'use strict'

const operations = require('../../operations')

const watchProcessLogs = (context) => {
  return operations.watchProcessLogs(context)
}

module.exports = watchProcessLogs
