'use strict'

const child_process = require('child_process')
const config = require('../config')
const PROCESS_STATUS = require('../../../common/process-status')

module.exports = function findProcessStatus (name, callback) {
  child_process.execFile(config.SYSTEMCTL_PATH, ['show', `${config.DAEMON_NAME}.${name}`, '--property=ActiveState'], (error, stdout) => {
    let status = PROCESS_STATUS.UNKNOWN

    if (!error && stdout) {
      const props = {}

      stdout.trim().split('\n').forEach((line) => {
        const parts = line.split('=')
        props[parts[0]] = parts[1]
      })

      if (props.ActiveState === 'failed') {
        status = PROCESS_STATUS.ERROR
      }

      if (props.ActiveState === 'activating') {
        status = PROCESS_STATUS.STARTING
      }

      if (props.ActiveState === 'active') {
        status = PROCESS_STATUS.RUNNING
      }

      if (props.ActiveState === 'deactivating') {
        status = PROCESS_STATUS.STOPPING
      }

      if (props.ActiveState === 'inactive') {
        status = PROCESS_STATUS.STOPPED
      }
    }

    callback(error, status)
  })
}
