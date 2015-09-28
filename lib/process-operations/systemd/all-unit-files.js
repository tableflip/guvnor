var async = require('async')
var ini = require('ini')
var fs = require('fs')
var path = require('path')
var config = require('./config')

module.exports = function systemdLoadProcessUnitFiles (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.UNIT_FILE_LOCATIONS),
    function filterFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return file.indexOf('guvnor.') === 0
      }))
    },
    function readFiles (files, next) {
      var jobs = {}

      files.forEach(function readFile (file) {
        jobs[file] = fs.readFile.bind(fs, path.join(config.UNIT_FILE_LOCATIONS, file), 'utf8')
      })

      async.parallel(jobs, next)
    },
    function parseFiles (fileContents, next) {
      async.map(fileContents, async.asyncify(ini.parse), next)
    },
    function combineFiles (parsedContents, next) {
      var services = {}
      var envs = {}

      Object.keys(parsedContents).forEach(function (key) {
        if (key.indexOf('guvnor.env.') === 0) {
          envs[key.substring('guvnor.env.'.length)] = parsedContents[key]
        } else {
          services[key.substring('guvnor.'.length)] = parsedContents[key]
        }
      })

      next(null, Object.keys(services).map(function (key) {
        var service = services[key]
        service.env = envs[key] || {}

        return service
      }))
    }
  ], callback)
}
