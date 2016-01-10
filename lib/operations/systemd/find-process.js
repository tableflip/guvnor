var async = require('async')
var loadUnitFile = require('./lib/load-unit-file')
var fileProcessStatus = require('./lib/find-process-status')
var config = require('./config')

module.exports = function systemdGetProcess (context, name, callback) {
  async.waterfall([
    loadUnitFile.bind(null, name),
    function (unit, next) {
      fileProcessStatus(unit.env[config.DAEMON_ENV_NAME + '_PROCESS_NAME'], function (error, status) {
        unit.status = status

        next(error, unit)
      })
    },
    function convertUnitToProcess (unit, next) {
      next(null, {
        name: unit.env[config.DAEMON_ENV_NAME + '_PROCESS_NAME'],
        script: unit.env[config.DAEMON_ENV_NAME + '_SCRIPT'],
        user: unit.Service.User,
        group: unit.Service.Group,
        status: unit.status
      })
    }
  ], callback)
}
