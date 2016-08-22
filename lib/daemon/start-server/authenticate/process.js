'use strict'

const Boom = require('boom')
const operations = require('../../../operations')
const context = require('../../lib/global-context')

const authenticateProcess = (name, fingerprint) => {
  return context()
  .then(context => {
    return operations.findProcessFingerprint(context, name)
    .then(processFingerprint => {
      if (processFingerprint !== fingerprint) {
        throw Boom.unauthorized('Invalid certificate', 'certificate')
      }

      return operations.findProcess(context, name)
    })
    .then(proc => {
      proc.scope = ['process']

      return proc
    })
  })
}

module.exports = authenticateProcess
