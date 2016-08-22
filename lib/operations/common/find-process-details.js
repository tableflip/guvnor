'use strict'

const operations = require('../')
const reportProcessStatus = require('./lib/report-process-status')

const findProcessDetails = (context, name) => {
  return operations.findProcess(context, name)
  .then(proc => reportProcessStatus(context, proc))
}

module.exports = findProcessDetails
