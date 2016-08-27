'use strict'

const fs = require('fs-promise')
const path = require('path')
const pem = require('pem-promise')
const config = require('../config')
const readOrCreateCertificate = require('./read-or-create-certificate')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:create-user-certificate'

module.exports = (context, ca, user, callback) => {
  const certificateDirectory = path.join(user.home, '.config', config.DAEMON_NAME)
  const keyFile = path.join(certificateDirectory, `${user.name}.key`)
  const certificateFile = path.join(certificateDirectory, `${user.name}.pub`)

  context.log([INFO, CONTEXT], `Checking for certificate at ${certificateFile}`)

  const certificateOpts = {
    commonName: user.name,
    organization: config.DAEMON_NAME,
    organizationUnit: 'user',
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    days: 1024
  }

  return readOrCreateCertificate(context, keyFile, certificateFile, certificateOpts)
  .then(results => {
    context.log([INFO, CONTEXT], `Certificate and key for user ${user.name} already exists`)
    context.log([INFO, CONTEXT], `Checking validity for user ${user.name}`)

    return pem.verifySigningChain(results.certificate, ca.certificate)
    .then(valid => {
      if (valid) {
        context.log([INFO, CONTEXT], `${user.name}'s certificate is valid`)
        return results
      }

      context.log([INFO, CONTEXT], `${user.name}'s certificate is invalid, regenerating`)

      return Promise.all([
        fs.unlink(certificateFile),
        fs.unlink(keyFile)
      ])
      .then(() => readOrCreateCertificate(context, keyFile, certificateFile, certificateOpts))
    })
  })
  .then(certs => {
    certs.ca = ca.certificate

    return certs
  })
}
