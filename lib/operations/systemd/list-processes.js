'use strict'

const allUnitFiles = require('./lib/all-unit-files')
const config = require('./config')
const operations = require('../')
const WARN = require('good-enough').WARN
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:systemd:list-processes'

const findProcess = (context, unit) => {
  return operations.findProcess(context, unit.Unit.Description)
  .catch(error => {
    context.log([WARN, CONTEXT], error)

    return {
      name: unit.Unit.Description,
      script: unit.env[`${config.DAEMON_ENV_NAME}_SCRIPT`],
      status: 'unknown',
      socket: unit.env[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`],
    }
  })
}

const systemdListProcesses = (context) => {
  context.log([INFO, CONTEXT], 'Listing processes')

  return allUnitFiles(context)
  .then(units => Promise.all(units.map(unit => findProcess(context, unit))))
}

module.exports = systemdListProcesses
