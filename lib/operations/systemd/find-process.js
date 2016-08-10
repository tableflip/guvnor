'use strict'

const async = require('async')
const loadUnitFile = require('./lib/load-unit-file')
const findProcessStatus = require('./lib/find-process-status')
const config = require('./config')

const findStatus = (unit, callback) => {
  findProcessStatus(unit.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`], function (error, status) {
    unit.status = status

    callback(error, unit)
  })
}

const convertUnitToProcess = (unit, callback) => {
  callback(null, {
    name: unit.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`],
    script: unit.env[`${config.DAEMON_ENV_NAME}_SCRIPT`],
    status: unit.status,
    socket: unit.env[`${config.DAEMON_ENV_NAME}_RPC_SOCKET`]
  })
}

const systemdGetProcess = (context, name, callback) => {
  async.waterfall([
    loadUnitFile.bind(null, name),
    findStatus,
    convertUnitToProcess
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}

module.exports = systemdGetProcess
