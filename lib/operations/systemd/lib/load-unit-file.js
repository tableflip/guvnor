'use strict'

const async = require('async')
const ini = require('ini')
const fs = require('fs')
const path = require('path')
const config = require('../config')

const DAEMON_PREFIX = `${config.DAEMON_NAME}.`
const SERVICE_SUFFIX = '.service'
const ENV_SUFFIX = '.env'
const KEY_SUFFIX = '.key'
const CERT_SUFFIX = '.cert'
const CA_SUFFIX = '.ca'
const UTF8 = 'utf8'

module.exports = function loadUnitFile (name, callback) {
  const unitFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${SERVICE_SUFFIX}`)
  const envFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${ENV_SUFFIX}`)
  const keyFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${KEY_SUFFIX}`)
  const certFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${CERT_SUFFIX}`)
  const caFile = path.join(config.UNIT_FILE_LOCATIONS, `${DAEMON_PREFIX}${name}${CA_SUFFIX}`)

  async.auto({
    unitContents: (next) => {
      fs.readFile(unitFile, {
        encoding: UTF8
      }, (error, contents) => {
        next(error, contents)
      })
    },
    envContents: (next) => {
      fs.readFile(envFile, {
        encoding: UTF8
      }, (error, contents) => {
        next(error, contents)
      })
    },
    unit: ['unitContents', (results, next) => {
      try {
        next(null, ini.parse(results.unitContents))
      } catch (e) {
        next(e)
      }
    }],
    env: ['envContents', (results, next) => {
      try {
        next(null, ini.parse(results.envContents))
      } catch (e) {
        next(e)
      }
    }],
    key: (next) => {
      fs.readFile(keyFile, {
        encoding: UTF8
      }, (error, contents) => {
        next(error, contents)
      })
    },
    cert: (next) => {
      fs.readFile(certFile, {
        encoding: UTF8
      }, (error, contents) => {
        next(error, contents)
      })
    },
    ca: (next) => {
      fs.readFile(caFile, {
        encoding: UTF8
      }, (error, contents) => {
        next(error, contents)
      })
    }
  }, (error, results) => {
    let service

    if (!error) {
      service = results.unit
      service.env = results.env || {}
      service.env[`${config.DAEMON_NAME.toUpperCase()}_CERT`] = results.cert
      service.env[`${config.DAEMON_NAME.toUpperCase()}_KEY`] = results.key
      service.env[`${config.DAEMON_NAME.toUpperCase()}_CA`] = results.ca
    }

    callback(error, service)
  })
}
