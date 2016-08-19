'use strict'

const createUserCertificate = require('../lib/create-user-certificate')
const operations = require('../../operations')

const createRootCertificate = (context, ca) => {
  return operations.findUserDetails(context, process.getuid())
  .then(user => createUserCertificate(context, ca, user))
}

module.exports = createRootCertificate
