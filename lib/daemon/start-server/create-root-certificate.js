'use strict'

const createUserCertificate = require('../lib/create-user-certificate')
const operations = require('../../operations')

module.exports = function createCertificate (ca, callback) {
  operations.findUserDetails(null, process.getuid(), function (error, user) {
    if (error) {
      return callback(error)
    }

    createUserCertificate(ca, user, function (error) {
      if (error && error.code === 'EENT') {
        error = null
      }

      callback(error, ca)
    })
  })
}
