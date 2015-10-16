var async = require('async')
var Boom = require('boom')
var platformOperations = require('../../../platform-operations')

module.exports = function authenticateUser (name, fingerprint, callback) {
  async.waterfall([
    platformOperations.findUserFingerprint.bind(null, name),
    function (userFingerprint, next) {
      if (userFingerprint !== fingerprint) {
        return next(Boom.unauthorized('Invalid certificate', 'certificate'))
      }

      platformOperations.findUserDetails(name, next)
    },
    function (user, next) {
      user.scope = ['user']

      if (user.name === 'root') {
        user.scope.push('admin')
      }

      next(null, user)
    }
  ], callback)
}
