var async = require('async')
var operations = require('../')

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

    if (proc.status === 'running') {
      tasks.push(operations.stopProcess.bind(null, user, name))
    }

    tasks.push(operations.removeProcessFiles.bind(null, user, name))

    async.series(tasks, function (error) {
      callback(error)
    })
  })
}
