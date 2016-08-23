'use strict'

const operations = require('../')
const reportProcessStatus = require('./lib/report-process-status')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:find-process-details'

const findProcessDetails = (context, name) => {
  context.log([INFO, CONTEXT], `Finding process details for ${name}`)

  return operations.findProcess(context, name)
  .then(proc => reportProcessStatus(context, proc))
}

module.exports = findProcessDetails
