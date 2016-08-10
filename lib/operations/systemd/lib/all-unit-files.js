'use strict'

const async = require('async')
const fs = require('fs')
const config = require('../config')
const loadUnitFile = require('./load-unit-file')

const DAEMON_PREFIX = `${config.DAEMON_NAME}.`
const SERVICE_SUFFIX = '.service'

const endsWith = (haystack, needle) => {
  return haystack.substring(haystack.length - needle.length) === needle
}

const startsWith = (haystack, needle) => {
  return haystack.indexOf(needle) === 0
}

const filterNonDaemonFiles = (files, next) => {
  next(null, files.filter((file) => file !== `${config.DAEMON_NAME}.service` && startsWith(file, DAEMON_PREFIX) && endsWith(file, SERVICE_SUFFIX)))
}

const mapToServiceName = (files, next) => {
  next(null, files.map((file) => file.substring(DAEMON_PREFIX.length, file.length - SERVICE_SUFFIX.length)))
}

const readFiles = (files, next) => {
  async.map(files, loadUnitFile, next)
}

module.exports = function systemdLoadProcessUnitFiles (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.UNIT_FILE_LOCATIONS),
    filterNonDaemonFiles,
    mapToServiceName,
    readFiles
  ], callback)
}
