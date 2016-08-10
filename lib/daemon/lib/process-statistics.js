'use strict'

const operations = require('../../operations')

const processes = {}

module.exports = function getProcess (user, name, callback) {
  name = name.toLowerCase()

  if (processes[name]) {
    return callback(null, processes[name])
  }

  operations.listProcesses(user, function listedProcesses (error, list) {
    if (error) {
      return callback(error)
    }

    const proc = list.filter(function (proc) {
      return proc.name === name
    }).pop()

    if (!proc) {
      return callback()
    }

    processes[name] = {
      exceptions: []
    }

    callback(null, processes[name])
  })
}

module.exports.remove = function (user, name) {
  name = name.toLowerCase()

  delete processes[name]
}
