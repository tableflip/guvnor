var async = require('async')
var loadPlist = require('./load-plist')
var plistName = require('./plist-name')
var findProcessStatus = require('./find-process-status')

module.exports = function systemdGetProcess (user, name, callback) {
  async.waterfall([
    plistName.bind(null, name),
    loadPlist,
    function (plist, next) {
      findProcessStatus(unit.env.GUVNOR_PROCESS_NAME, function (error, status) {
        plist.status = status

        next(error, plist)
      })
    },
    function convertPlistToProcess (plist, next) {
      next(null, {
        name: unit.env.GUVNOR_PROCESS_NAME,
        script: unit.env.GUVNOR_SCRIPT,
        user: unit.Service.User,
        group: unit.Service.Group,
        status: unit.status
      })
    }
  ], callback)
}
