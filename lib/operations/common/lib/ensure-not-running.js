'use strict'

const operations = require('../../')
const PROCESS_STATUS = require('../../../common/process-status')

const ensureNotRunning = (context, name) => {
  return operations.findProcess(context, name)
  .then((proc, next) => {
    if (proc && proc.status === PROCESS_STATUS.RUNNING) {
      const error = new Error(`${name} is already running!`)
      error.code = 'ERUNNING'

      throw error
    }
  })
}

module.exports = ensureNotRunning
