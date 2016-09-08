'use strict'

const fs = require('fs-promise')
const path = require('path')
const pem = require('pem-promise')
const config = require('../config')
const readCertificate = require('./read-certificate')
const createCertificate = require('./create-certificate')
const validateCertificate = require('./validate-certificate')
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

  return readCertificate(context, keyFile, certificateFile)
  .then(certs => {
    context.log([INFO, CONTEXT], `Certificate and key for user ${user.name} exists`)
    context.log([INFO, CONTEXT], `Checking validity for user ${user.name}`)

    return validateCertificate(context, certs.certificate, ca.certificate)
      .then(() => {
        const error = new Error(`${user.name}'s certificate already exists and is valid`)
        error.code = 'ECERTEXISTS'

        throw error
      })
      .catch(error => {
        if (error.code === 'EINVALIDCERTIFICATE') {


          return Promise.all([
            fs.unlink(certificateFile),
            fs.unlink(keyFile)
          ])
        }

        throw error
      })
  })
  .catch(error => {
    if (error.code === 'ENOENT') {
      context.log([INFO, CONTEXT], `${user.name}'s certificate did not exist, generating`)
    } else if (error.code === 'EINVALIDCERTIFICATE') {
      context.log([INFO, CONTEXT], `${user.name}'s certificate is invalid, regenerating`)
    } else {
      throw error
    }
  })
  .then(() => createCertificate(context, keyFile, certificateFile, certificateOpts))
  .then(certs => {
    certs.ca = ca.certificate

    return certs
  })
}
