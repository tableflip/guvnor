'use strict'

const operations = require('../')
const reportProcessStatus = require('./lib/report-process-status')

const findProcessDetails = (context, name) => {
  return operations.findProcess(context, name)
  .then(proc => {
    return reportProcessStatus(context, proc)
    .then(status => {
      proc.master = status.master
      proc.workers = status.workers

      return proc
    })
  })
}

module.exports = findProcessDetails
