var async = require('async')
var loadPlist = require('./load-plist')
var plistName = require('./plist-name')
var findProcessStatus = require('./find-process-status')

module.exports = function systemdGetProcess (user, name, callback) {
  async.waterfall([
    plistName.bind(null, name),
    loadPlist,
    function findStatus (plist, next) {
      findProcessStatus(plist.env.GUVNOR_PROCESS_NAME, function (error, status) {
        plist.status = status

        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      next(null, {
        name: plist.env.GUVNOR_PROCESS_NAME,
        script: plist.env.GUVNOR_SCRIPT,
        user: plist.Service.User,
        group: plist.Service.Group,
        status: plist.status
      })
    }
  ], callback)
}
