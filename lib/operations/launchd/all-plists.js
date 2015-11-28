var async = require('async')
var fs = require('fs')
var config = require('./config')
var loadPlist = require('./load-plist')

module.exports = function launchdLoadProcessPlists (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.PLIST_LOCATIONS),
    function filterFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return file.substring(0, 7) === 'guvnor.'
      }))
    },
    function readFiles (files, next) {
      async.map(files, loadPlist, next)
    }
  ], callback)
}
