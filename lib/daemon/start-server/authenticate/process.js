var async = require('async')
var Boom = require('boom')
var operations = require('../../../operations')

module.exports = function authenticateProcess (name, fingerprint, callback) {
  async.waterfall([
    operations.findProcessFingerprint.bind(null, name),
    function (processFingerprint, next) {
      if (processFingerprint !== fingerprint) {
        return next(Boom.unauthorized('Invalid certificate', 'certificate'))
      }

      operations.findProcess(null, name, next)
    },
    function (proc, next) {
      if (proc) {
        proc.scope = ['process']
      }

      return next(error, proc)
    }
  ], callback)
}
