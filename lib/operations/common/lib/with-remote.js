'use strict'

const operations = require('../../')
const withRemoteProcess = require('./with-remote-process')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:lib:with-remote'

const withRemote = (context, name, func) => {
  context.log([INFO, CONTEXT], `With remote ${name}`)

  return operations.findProcess(context, name)
  .then(proc => withRemoteProcess(context, proc, func))
}

module.exports = withRemote
