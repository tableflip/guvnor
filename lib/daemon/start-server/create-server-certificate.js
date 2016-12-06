'use strict'

const pem = require('pem-promise')
const path = require('path')
const config = require('../config')
const os = require('os')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:start-server:create-server-certificate'

const createServerCertificate = (context, ca) => {
  context.log([INFO, CONTEXT], `Generating SSL certificate for ${config.HTTPS_HOST}`)

  const altNames = [
    config.HTTPS_HOST,
    os.hostname(),
    'localhost'
  ]
  const interfaces = os.networkInterfaces()

  Object.keys(interfaces).forEach(function (type) {
    interfaces[type].forEach(function (networkInterface) {
      altNames.push(networkInterface.address)
    })
  })

  return pem.createCertificate({
    serviceKey: ca.key,
    serviceCertificate: ca.certificate,
    serial: Date.now(),
    commonName: config.HTTPS_HOST,
    altNames: altNames,
    days: 4096
  })
  .then(result => {
    result.serviceCertificate = ca.certificate

    return result
  })
}

module.exports = createServerCertificate
