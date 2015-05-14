var async = require('async')
var plist = require('plist')
var fs = require('fs')
var path = require('path')
var config = require('./config')

module.exports = function launchdLoadProcessPlists (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.PLIST_LOCATIONS),
    function filterFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return file.substring(0, 7) === 'guvnor.'
      }))
    },
    function readFiles (files, next) {
      async.parallel(files.map(function readFile (file) {
        return fs.readFile.bind(fs, path.join(config.PLIST_LOCATIONS, file), 'utf8')
      }), next)
    },
    function parseFiles (fileContents, next) {
      next(null, fileContents.map(function (contents) {
        return plist.parse(contents)
      }))
    }
  ], callback)
}
