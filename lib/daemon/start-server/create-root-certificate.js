var createUserCertificate = require('../lib/create-user-certificate')
var operations = require('../../operations')

module.exports = function createCertificate (ca, callback) {
  operations.findUserDetails(process.getuid(), function (error, user) {
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
