'use strict'

const operations = require('../../')
const PROCESS_STATUS = require('../../../common/process-status')
const explode = require('../../../common/explode')

const ensureNotRunning = (context, name) => {
  return operations.findProcess(context, name)
  .then(proc => {
    if (proc && proc.status === PROCESS_STATUS.RUNNING) {
      throw explode(explode.ERUNNING, `Process ${proc.name} is already running!`)
    }
  })
}

module.exports = ensureNotRunning
