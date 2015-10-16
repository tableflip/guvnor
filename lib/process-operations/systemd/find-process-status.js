var child_process = require('child_process')
var config = require('./config')

module.exports = function findProcessStatus (unit, callback) {
  child_process.execFile(config.SYSTEMCTL_PATH, ['show', 'guvnor.' + unit.env.GUVNOR_PROCESS_NAME, '--property=ActiveState'], function (error, stdout) {
    var status = 'unknown'

      if (props.ActiveState === 'failed') {
        status = 'error'
      }

      if (props.ActiveState === 'active') {
        status = 'running'
      }

      if (props.ActiveState === 'inactive') {
        status = 'stopped'
      }

    callback(null, status)
  })
}
