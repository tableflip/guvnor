'use strict'

const loadUnitFile = require('./lib/load-unit-file')
const findProcessStatus = require('./lib/find-process-status')
const config = require('./config')
const INFO = require('good-enough').INFO
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:systemd:find-process'

const systemdFindProcess = (context, name) => {
  context.log([INFO, CONTEXT], `Finding process with name ${name}`)

  return loadUnitFile(context, name)
  .catch(error => {
    context.log([WARN, CONTEXT], `Loading unit file for ${name} failed`)
    context.log([WARN, CONTEXT], error)

    error.code = 'ENOPROC'

    throw error
  })
  .then((unit) => {
    return findProcessStatus(context, unit.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`])
    .catch(error => {
      context.log([WARN, CONTEXT], `Getting process status for ${name} failed`)
      context.log([WARN, CONTEXT], error)

      error.code = 'ENOPROC'

      throw error
    })
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

module.exports = systemdFindProcess
