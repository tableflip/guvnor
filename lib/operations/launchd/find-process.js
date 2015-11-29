var async = require('async')
var loadPlist = require('./load-plist')
var plistName = require('./plist-name')
var findProcessStatus = require('./find-process-status')
var logger = require('winston')

module.exports = function launchdGetProcess (user, name, callback) {
  async.waterfall([
    function (next) {
      loadPlist(plistName(name), function (error, plist) {
        if (error) {
          logger.debug('Ignoring plist error', error)
          return callback(null, null)
        }

        next(error, plist)
      })
    },
    function (plist, next) {
      findProcessStatus(plist.env.GUVNOR_PROCESS_NAME, function (error, status) {
        plist.status = status
        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      next(null, {
        name: plist.env.GUVNOR_PROCESS_NAME,
        script: plist.env.GUVNOR_SCRIPT,
        user: plist.UserName,
        group: plist.GroupName,
        status: plist.status
      })
    }
  ], callback)
}
