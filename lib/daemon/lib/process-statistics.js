'use strict'

const processes = {}

module.exports = (context, name) => {
  name = name.toLowerCase()

  if (!processes[name]) {
    processes[name] = {
      exceptions: []
    }
  }

  return processes[name]
}

module.exports.remove = function (context, name) {
  name = name.toLowerCase()

  delete processes[name]
}
