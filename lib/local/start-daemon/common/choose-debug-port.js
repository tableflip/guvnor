'use strict'

const freeport = require('freeport')

module.exports = function chooseDebugPort (options, callback) {
  if (options.debug.daemon === true) {
    return freeport(function (error, port) {
      if (error) {
        return callback(error)
      }

      options.debug.daemon = port
      callback(null, options)
    })
  }

  callback(null, options)
}
