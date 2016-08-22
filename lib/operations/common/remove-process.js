'use strict'

const operations = require('../')
const PROCESS_STATUS = require('../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:remove-process'

const removeProcess = (context, name, callback) => {
  return operations.findProcess(context, name)
  .then(proc => {
    if (proc.status === PROCESS_STATUS.RUNNING) {
      context.log([DEBUG, CONTEXT], `${name} was running, will stop it first`)
      return operations.stopProcess(context, name)
    }
  })
  .then(() => operations.removeProcessFiles(context, name))
}

module.exports = removeProcess
