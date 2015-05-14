var processOperations = require('../../process-operations')

module.exports = function findProcessWithCertificate (fingerprint, callback) {
  processOperations.listProcessCertificateFingerprints(function listedProcessCertificateFingerprints (error, results) {
    if (error) {
      return callback(error)
    }

    var proc = results[fingerprint]

    if (proc) {
      proc.scope = 'process'
    }

    return callback(null, proc)
  })
}
