var async = require('async')
var loadUnitFile = require('./load-unit-file')
var child_process = require('child_process')
var config = require('./config')
var fs = require('fs')
var findProcessStatus = require('./find-process-status')

var GUVNOR_PREFIX = 'guvnor.'
var SERVICE_SUFFIX = '.service'

function endsWith(haystack, needle) {
  return haystack.substring(haystack.length - needle.length) === needle
}

function startsWith(haystack, needle) {
  return haystack.indexOf(needle) === 0
}

module.exports = function systemdListBasicProcesses (user, callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.UNIT_FILE_LOCATIONS),
    function filterNonGuvnorFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return startsWith(file, GUVNOR_PREFIX) && endsWith(file, SERVICE_SUFFIX)
      }))
    },
    function mapToServiceName (files, next) {
      next(null, files.map(function fileFilter (file) {
        return file.substring(GUVNOR_PREFIX.length, file.length - SERVICE_SUFFIX.length)
      }))
    },
    function readFiles (files, next) {
      async.map(files, loadUnitFile, next)
    },
    function findProcessStatuses (units, next) {
      async.map(units, function (unit, done) {
        findProcessStatus(unit.env.GUVNOR_PROCESS_NAME, function (error, status) {
          unit.status = status

          done(error, unit)
        })
      }, next)
    },
    function convertUnitsToProcesses (units, next) {
      next(null, units.map(function convertUnitToProcess (unit, next) {
        return {
          name: unit.env.GUVNOR_PROCESS_NAME,
          script: unit.env.GUVNOR_SCRIPT,
          user: unit.Service.User,
          group: unit.Service.Group,
          status: unit.status
        }
      }))
    }
  ], callback)
}
