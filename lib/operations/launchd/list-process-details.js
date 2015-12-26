var async = require('async')
var listPlists = require('./lib/list-plists')
var operations = require('../')

module.exports = function launchdListProcesses (context, callback) {
  async.waterfall([
    listPlists,
    function (plists, next) {
      async.parallel(plists.map(function (plist) {
        return function (done) {
          operations.findProcessDetails(context, plist, done)
        }
      }), next)
    }
  ], callback)
}
