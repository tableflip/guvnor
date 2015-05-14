var createUserCertificate = require('../lib/create-user-certificate')
var platformOperations = require('../../platform-operations')

module.exports = function createCertificate (ca, callback) {
  platformOperations.findUserDetails(process.getuid(), function (error, user) {
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
