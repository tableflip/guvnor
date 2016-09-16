'use strict'

const run = require('./run')
const which = require('which')

const find = command => {
  return new Promise((resolve, reject) => {
    which(command, (error, result) => {
      if (error) {
        reject(error)
      }

      return resolve(result)
    })
  })
}

module.exports = find
