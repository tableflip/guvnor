'use strict'

const Boom = require('boom')
const operations = require('../../../operations')
const context = require('../../lib/global-context')

const authenticateUser = (name, fingerprint) => {
  return context()
  .then(context => {
    return operations.findUserFingerprint(context, name)
    .then(userFingerprint => {
      if (userFingerprint !== fingerprint) {
        throw Boom.unauthorized('Invalid certificate', 'certificate')
      }

      return operations.findUserDetails(context, name)
    })
    .then(user => {
      user.scope = ['user']

      if (user.name === 'root') {
        user.scope.push('admin')
      }

      return user
    })
  })
}


module.exports = authenticateUser
