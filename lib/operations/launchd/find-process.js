'use strict'

const loadPlist = require('./lib/load-plist')
const allProcesses = require('./lib/all-processes')
const PROCESS_STATUS = require('../../common/process-status')
const config = require('./config')

const findProcessStatus = (name) => {
  return allProcesses()
  .then(processes => {
    const proc = processes.filter(function (proc) {
      return proc.name === name
    }).pop()

    if (!proc) {
      return PROCESS_STATUS.STOPPED
    }

    let status = PROCESS_STATUS.UNKNOWN

    if (proc.pid === 0) {
      status = PROCESS_STATUS.STOPPED
    }

    if (proc.exitCode < 0) {
      status = PROCESS_STATUS.ERROR
    }

    if (proc.pid > 0) {
      status = PROCESS_STATUS.RUNNING
    }

    return status
  })
}

const convertPlistToProcess = (plist) => {
  return findProcessStatus(plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`])
  .then(status => {
    return {
      name: plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
      script: plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_SCRIPT`],
      status: status,
      socket: plist.EnvironmentVariables[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`]
    }
  })
}

const launchdFindProcess = (context, name) => {
  return loadPlist(name)
  .then(plist => convertPlistToProcess(plist))
  .catch(error => {
    if (error.code === 'ENOENT') {
      error.code = 'ENOPROC'
    }

    throw error
  })
}

module.exports = launchdFindProcess
