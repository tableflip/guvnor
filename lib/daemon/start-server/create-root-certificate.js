'use strict'

const createUserCertificate = require('../lib/create-user-certificate')
const operations = require('../../operations')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server:create-root-certificate'

const createRootCertificate = (context, ca) => {
  context.log([INFO, CONTEXT], `Creating certificate for ${context.user.name}`)
  return createUserCertificate(context, ca, context.user)
  .catch(error => {
    if (error.code !== 'ECERTEXISTS') {
      throw error
    }
  })
}

module.exports = createRootCertificate
