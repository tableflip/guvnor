'use strict'

const fs = require('fs-promise')
const config = require('../config')
const loadUnitFile = require('./load-unit-file')
const INFO = require('good-enough').INFO
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:systemd:lib:all-unit-files'

const DAEMON_PREFIX = `${config.DAEMON_NAME}.`
const SERVICE_SUFFIX = '.service'

const endsWith = (haystack, needle) => {
  return haystack.substring(haystack.length - needle.length) === needle
}

const startsWith = (haystack, needle) => {
  return haystack.indexOf(needle) === 0
}

const systemdLoadProcessUnitFiles = (context) => {
  context.log([INFO, CONTEXT], `Loading unit files from ${config.UNIT_FILE_LOCATIONS}`)

  return fs.readdir(config.UNIT_FILE_LOCATIONS)
  // filter non daemon file
  .then(files => files.filter(file => file !== `${config.DAEMON_NAME}.service` && startsWith(file, DAEMON_PREFIX) && endsWith(file, SERVICE_SUFFIX)))
  // map to service name
  .then(files => files.map(file => file.substring(DAEMON_PREFIX.length, file.length - SERVICE_SUFFIX.length)))
  // read files
  .then(files => Promise.all(files.map(file => loadUnitFile(context, file)
    // log any errors loading files
    .catch(error => {
      context.log([WARN, CONTEXT], 'Error loading unit file')
      context.log([WARN, CONTEXT], error)
    }))
  ))
  .then(units => units.filter(unit => !!unit))
}

module.exports = systemdLoadProcessUnitFiles
