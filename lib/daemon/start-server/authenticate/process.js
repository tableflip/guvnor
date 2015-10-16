var async = require('async')
var Boom = require('boom')
var processOperations = require('../../../process-operations')

module.exports = function authenticateProcess (name, fingerprint, callback) {
  async.waterfall([
    processOperations.findProcessFingerprint.bind(null, name),
    function (processFingerprint, next) {
      if (processFingerprint !== fingerprint) {
        return next(Boom.unauthorized('Invalid certificate', 'certificate'))
      }

      processOperations.findProcess(null, name, next)
    },
    function (proc, next) {
      if (proc) {
        proc.scope = ['process']
      }

      return next(error, proc)
    }
  ], callback)
}
