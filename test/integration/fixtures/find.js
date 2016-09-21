'use strict'

const run = require('./run')
const which = require('which-promise')

const find = command => {
  return which(command)
}

module.exports = find
