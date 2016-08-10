'use strict'

const operations = require('../../operations')

module.exports = function findProcessWithCertificate (fingerprint, callback) {
  operations.listProcessCertificateFingerprints(function listedProcessCertificateFingerprints (error, results) {
    if (error) {
      return callback(error)
    }

    const proc = results[fingerprint]

    if (proc) {
      proc.scope = 'process'
    }

    return callback(null, proc)
  })
}
