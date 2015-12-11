var async = require('async')
var listPlists = require('../list-plists')
var loadPlist = require('./load-plist')

module.exports = function launchdAllProcessPlists (callback) {
  async.waterfall([
    listPlists,
    function loadPlists (files, next) {
      async.map(files, loadPlist, next)
    }
  ], callback)
}
