var async = require('async')
var operations = require('../')
var PROCESS_STATUS = require('../../common/process-status')
var logger = require('winston')

module.exports = function removeProcess (user, name, callback) {
  operations.findProcess(user, name, function (error, proc) {
    if (!error && !proc) {
      error = new Error('Unknown process')
      error.code = 'ENOENT'
    }

    if (error) {
      return callback(error)
    }

    var tasks = []

    logger.debug('%s has status', name, proc.status)
    console.info(JSON.stringify(proc, null, 2))

    if (proc.status === PROCESS_STATUS.RUNNING) {
      logger.debug('%s was running, will stop it first', name)
      tasks.push(operations.stopProcess.bind(null, user, name))
    } else {
      logger.debug('%s was not running', name)
    }

    tasks.push(operations.removeProcessFiles.bind(null, user, name))

    async.series(tasks, function (error) {
      callback(error)
    })
  })
}
