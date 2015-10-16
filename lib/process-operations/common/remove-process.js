var async = require('async')
var processOperations = require('../')

module.exports = function removeProcess (user, name, callback) {
  processOperations.findProcess(user, name, function (error, proc) {
    if (!error && !proc) {
      error = new Error('Unknown process')
      error.code = 'ENOENT'
    }

    if (error) {
      return callback(error)
    }

    var tasks = []

    if (proc.status === 'running') {
      tasks.push(processOperations.stopProcess.bind(null, user, name))
    }

    tasks.push(processOperations.removeProcessFiles.bind(null, user, name))

    async.series(tasks, function (error) {
      callback(error)
    })
  })
}
