var platformOperations = require('../platform-operations')
var loadCertificate = require('./load-certificate')
var createApi = require('../local/api')
var async = require('async')

module.exports = function loadApi (callback) {
  async.auto({
    user: platformOperations.findUserDetails.bind(null, process.getuid()),
    certificate: ['user', function (next, results) {
      loadCertificate(results.user, next)
    }],
    api: ['certificate', function (next, results) {
      createApi(results.certificate, next)
    }]
  }, function (error, results) {
    callback(error, results ? results.api : null)
  })
}
