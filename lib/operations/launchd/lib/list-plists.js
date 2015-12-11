var async = require('async')
var fs = require('fs')
var config = require('../config')

module.exports = function launchdListGuvnorPlists (callback) {
  async.waterfall([
    fs.readdir.bind(fs, config.PLIST_LOCATIONS),
    function filterFiles (files, next) {
      next(null, files.filter(function fileFilter (file) {
        return file.substring(0, 7) === 'guvnor.'
      }))
    }
  ], callback)
}
