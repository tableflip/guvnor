var async = require('async')
var allUnitfiles = require('./all-unit-files')
var child_process = require('child_process')
var config = require('./config')

module.exports = function systemdListBasicProcesses (user, callback) {
  async.waterfall([
    allUnitfiles,
    function findProcessStatuses (units, next) {
      async.map(units, function (unit, done) {
        child_process.execFile(config.SYSTEMCTL_PATH, ['show', 'guvnor.' + unit.env.GUVNOR_PROCESS_NAME, '--property=ActiveState'], function (error, stdout) {
          var proc = null

          if (!error) {
            proc = {
              name: unit.env.GUVNOR_PROCESS_NAME,
              script: unit.env.GUVNOR_SCRIPT,
              user: unit.Service.User,
              group: unit.Service.Group,
              status: 'unknown'
            }

            var props = {}

            stdout.trim().split('\n').forEach(function (line) {
              var parts = line.split('=')
              props[parts[0]] = parts[1]
            })

            if (props.ActiveState === 'failed') {
              proc.status = 'error'
            }

            if (props.ActiveState === 'active') {
              proc.status = 'running'
            }

            if (props.ActiveState === 'inactive') {
              proc.status = 'stopped'
            }
          }
          done(null, proc)
        })
      }, callback)
    }
  ], callback)
}
