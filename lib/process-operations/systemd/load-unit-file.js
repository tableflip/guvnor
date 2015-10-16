var async = require('async')
var ini = require('ini')
var fs = require('fs')
var path = require('path')
var config = require('./config')

var GUVNOR_PREFIX = 'guvnor.'
var SERVICE_SUFFIX = '.service'
var ENV_SUFFIX = '.env'
var KEY_SUFFIX = '.key'
var CERT_SUFFIX = '.cert'
var CA_SUFFIX = '.ca'
var UTF8 = 'utf8'

module.exports = function loadUnitFile (name, callback) {
  var unitFile = path.join(config.UNIT_FILE_LOCATIONS, GUVNOR_PREFIX + name + SERVICE_SUFFIX)
  var envFile = path.join(config.UNIT_FILE_LOCATIONS, GUVNOR_PREFIX + name + ENV_SUFFIX)
  var keyFile = path.join(config.UNIT_FILE_LOCATIONS, GUVNOR_PREFIX + name + KEY_SUFFIX)
  var certFile = path.join(config.UNIT_FILE_LOCATIONS, GUVNOR_PREFIX + name + CERT_SUFFIX)
  var caFile = path.join(config.UNIT_FILE_LOCATIONS, GUVNOR_PREFIX + name + CA_SUFFIX)

  async.auto({
    unitContents: fs.readFile.bind(fs, unitFile, UTF8),
    envContents: fs.readFile.bind(fs, unitFile, UTF8),
    unit: ['unitContents', function (next, results) {
      try {
        next(null, ini.parse(results.unitContents))
      } catch (e) {
        next(e)
      }
    }],
    env: ['envContents', function (next, results) {
      try {
        next(null, ini.parse(results.envContents))
      } catch (e) {
        next(e)
      }
    }],
    key: fs.readFile.bind(fs, keyFile, UTF8),
    cert: fs.readFile.bind(fs, certFile, UTF8),
    ca: fs.readFile.bind(fs, caFile, UTF8)
  }, function (error, results) {
    var service

    if (!error) {
      service = results.unit
      service.env = results.env || {}
      service.env.GUVNOR_CERT = results.cert
      service.env.GUVNOR_KEY = results.key
      service.env.GUVNOR_CA = results.ca
    }

    callback(error, service)
  })
}
