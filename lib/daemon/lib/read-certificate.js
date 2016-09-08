'use strict'

const fs = require('fs-promise')
const pem = require('pem-promise')
const path = require('path')
const INFO = require('good-enough').INFO
const CONTEXT = 'daemon:lib:read-certificate'

const readCertificate = (context, keyFile, certFile) => {
  const certificateDirectory = path.dirname(certFile)

  context.log([INFO, CONTEXT], `Ensuring ${certificateDirectory} exists`)

  return fs.ensureDir(certificateDirectory)
  .then(() => Promise.all([
    fs.readFile(certFile, {
      encoding: 'utf8'
    }),
    fs.readFile(keyFile, {
      encoding: 'utf8'
    })
  ]))
  .then(results => {
    context.log([INFO, CONTEXT], `Certificate found at ${certFile}`)
    context.log([INFO, CONTEXT], `Key found at ${keyFile}`)

    return pem.readCertificateInfo(results[0])
    .then(() => results)
  })
  .then(results => {
    return {
      certificate: results[0],
      key: results[1]
    }
  })
}

module.exports = readCertificate
