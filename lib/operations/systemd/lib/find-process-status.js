var child_process = require('child_process')
var config = require('../config')
var PROCESS_STATUS = require('../../../common/process-status')

module.exports = function findProcessStatus (name, callback) {
  child_process.execFile(config.SYSTEMCTL_PATH, ['show', 'guvnor.' + name, '--property=ActiveState'], function (error, stdout) {
    var status = PROCESS_STATUS.UNKNOWN

    if (!error && stdout) {
      var props = {}

      stdout.trim().split('\n').forEach(function (line) {
        var parts = line.split('=')
        props[parts[0]] = parts[1]
      })

      if (props.ActiveState === 'failed') {
        status = PROCESS_STATUS.ERROR
      }

      if (props.ActiveState === 'active') {
        status = PROCESS_STATUS.RUNNING
      }

      if (props.ActiveState === 'inactive') {
        status = PROCESS_STATUS.STOPPED
      }
    }

    callback(error, status)
  })
}
