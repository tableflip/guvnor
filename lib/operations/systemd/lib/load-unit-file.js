'use strict'

const ini = require('ini')
const fs = require('fs-promise')
const path = require('path')
const config = require('../config')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:systemd:lib:load-unit-files'

const DAEMON_PREFIX = `${config.DAEMON_NAME}.`
const SERVICE_SUFFIX = '.service'
const ENV_SUFFIX = '.env'
const KEY_SUFFIX = '.key'
const CERT_SUFFIX = '.cert'
const CA_SUFFIX = '.ca'
const UTF8 = 'utf8'

const loadUnitFile = (context, name) => {
  context.log([INFO, CONTEXT], `Loading unit file for ${name}`)

  const unitFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${SERVICE_SUFFIX}`)
  const envFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${ENV_SUFFIX}`)
  const keyFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${KEY_SUFFIX}`)
  const certFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${CERT_SUFFIX}`)
  const caFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${CA_SUFFIX}`)

  return Promise.all([
    fs.readFile(unitFile, {
      encoding: UTF8
    })
    .then(contents => ini.parse(contents)),
    fs.readFile(envFile, {
      encoding: UTF8
    })
    .then(contents => ini.parse(contents)),
    fs.readFile(keyFile, {
      encoding: UTF8
    }),
    fs.readFile(certFile, {
      encoding: UTF8
    }),
    fs.readFile(caFile, {
      encoding: UTF8
    })
  ])
  .then(results => {
    const service = results[0]
    service.env = results[1] || {}
    service.env[`${config.DAEMON_NAME.toUpperCase()}_CERT`] = results[3]
    service.env[`${config.DAEMON_NAME.toUpperCase()}_KEY`] = results[2]
    service.env[`${config.DAEMON_NAME.toUpperCase()}_CA`] = results[4]

    return service
  })
}

module.exports = loadUnitFile
