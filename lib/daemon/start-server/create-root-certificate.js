'use strict'

const createUserCertificate = require('../lib/create-user-certificate')
const operations = require('../../operations')

const createRootCertificate = (ca) => {
  return operations.findUserDetails(null, process.getuid())
  .then(user => createUserCertificate(ca, user))
}

module.exports = createRootCertificate
