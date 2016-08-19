'use strict'

const loadUnitFile = require('./lib/load-unit-file')
const findProcessStatus = require('./lib/find-process-status')
const config = require('./config')

const systemdGetProcess = (context, name) => {
  return loadUnitFile(name)
  .then((unit) => {
    return findProcessStatus(unit.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`])
    .then(status => {
      return {
        name: unit.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
        script: unit.env[`${config.DAEMON_ENV_NAME}_SCRIPT`],
        status: status,
        socket: unit.env[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`]
      }
    })
  })
}

module.exports = systemdGetProcess
