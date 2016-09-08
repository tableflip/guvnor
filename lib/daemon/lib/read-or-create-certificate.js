'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const path = require('path')
const readCertificate = require('./read-certificate')
const generateCertificate = require('./create-certificate')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:read-or-create-certificate'

const readOrCreateCertificate = (context, keyFile, certFile, certOpts, keyExtractor) => {
  return readCertificate(context, keyFile, certFile)
  .catch(error => {
    context.log([INFO, CONTEXT], `Could not read certificate from ${certFile} or key from ${keyFile}`)
    context.log([INFO, CONTEXT], error)
    context.log([INFO, CONTEXT], `Generating new certificate with opts ${JSON.stringify(certOpts, null, 2)}`)

    return generateCertificate(context, keyFile, certFile, certOpts, keyExtractor)
  })
}

module.exports = readOrCreateCertificate
