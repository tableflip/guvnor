var async = require('async')
var fs = require('fs')
var config = require('./config')
var loadUnitFile = require('./load-unit-file')

var GUVNOR_PREFIX = 'guvnor.'
var SERVICE_SUFFIX = '.service'

function endsWith (haystack, needle) {
  return haystack.substring(haystack.length - needle.length) === needle
}

function startsWith (haystack, needle) {
  return haystack.indexOf(needle) === 0
}

module.exports = function systemdLoadProcessUnitFiles (callback) {
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
    }
  ], callback)
}
