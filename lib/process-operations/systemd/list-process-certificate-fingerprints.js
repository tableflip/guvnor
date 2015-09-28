var async = require('async')
var pem = require('pem')
var fs = require('fs')
var ini = require('ini')
var config = require('./config')
var allUnitfiles = require('./all-unit-files')

module.exports = function systemdListProcessCertificateFingerprints (callback) {
  async.waterfall([
    allUnitfiles,
    function filterProcessesWithoutCertificates (services, next) {
      next(null, services.filter(function serviceFilter (service) {
        return service && service.env && service.env.GUVNOR_CERT
      }))
    },
    function findCertificateFingerprints (services, next) {
      var output = {}

      async.map(services, function getFingerprint (service, done) {
        pem.getFingerprint(service.env.GUVNOR_CERT, function gotFingerprint (error, fingerprint) {
          if (!error) {
            output[fingerprint.fingerprint] = {
              name: service.Unit.Description,
              script: service.env.GUVNOR_SCRIPT,
              status: 'unknown',
              user: service.Service.User,
              group: service.Service.Group
            }
          }

          done(error)
        })
      }, function foundCertificateFingerprints (error) {
        next(error, output)
      })
    }
  ], callback)
}
