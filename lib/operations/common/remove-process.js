'use strict'

const async = require('async')
const operations = require('../')
const PROCESS_STATUS = require('../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:remove-process'

module.exports = function removeProcess (context, name, callback) {
  operations.findProcess(context, name, function (error, proc) {
    if (!error && !proc) {
      error = new Error('Unknown process')
      error.code = 'ENOENT'
    }

    if (error) {
      return callback(error)
    }

    const tasks = []

    if (proc.status === PROCESS_STATUS.RUNNING) {
      context.log([DEBUG, CONTEXT], `${name} was running, will stop it first`)
      tasks.push(operations.stopProcess.bind(null, context, name))
    }

    tasks.push(operations.removeProcessFiles.bind(null, context, name))

    async.series(tasks, function (error) {
      callback(error)
    })
  })
}
