'use strict'

const operations = require('../../')
const PROCESS_STATUS = require('../../../common/process-status')
const error = require('../../../common/error')

const ensureNotRunning = (context, name) => {
  return operations.findProcess(context, name)
  .then(proc => {
    if (proc && proc.status === PROCESS_STATUS.RUNNING) {
      throw error(error.ERUNNING, `Process ${proc.name} is already running!`)
    }
  })
}

module.exports = ensureNotRunning
