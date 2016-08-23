'use strict'

const execFile = require('mz/child_process').execFile
const config = require('../config')
const PROCESS_STATUS = require('../../../common/process-status')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:systemd:lib:find-process-status'

const findProcessStatus = (context, name) => {
  context.log([INFO, CONTEXT], `Finding process status for ${name}`)

  return execFile(config.SYSTEMCTL_PATH, ['show', `${config.DAEMON_NAME}.${name}`, '--property=ActiveState'])
  .then(result => {
    const props = {}

    result[0].trim().split('\n').forEach((line) => {
      const parts = line.split('=')
      props[parts[0]] = parts[1]
    })

    if (props.ActiveState === 'failed') {
      return PROCESS_STATUS.ERROR
    }

    if (props.ActiveState === 'activating') {
      return PROCESS_STATUS.STARTING
    }

    if (props.ActiveState === 'active') {
      return PROCESS_STATUS.RUNNING
    }

    if (props.ActiveState === 'deactivating') {
      return PROCESS_STATUS.STOPPING
    }

    if (props.ActiveState === 'inactive') {
      return PROCESS_STATUS.STOPPED
    }

    return PROCESS_STATUS.UNKNOWN
  })
}

module.exports = findProcessStatus
