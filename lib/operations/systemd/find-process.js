var async = require('async')
var loadUnitFile = require('./load-unit-file')
var fileProcessStatus = require('./find-process-status')

module.exports = function systemdGetProcess (user, name, callback) {
  async.waterfall([
    loadUnitFile.bind(null, name),
    function (unit, next) {
      fileProcessStatus(unit.env.GUVNOR_PROCESS_NAME, function (error, status) {
        unit.status = status

        next(error, unit)
      })
    },
    function convertUnitToProcess (unit, next) {
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
