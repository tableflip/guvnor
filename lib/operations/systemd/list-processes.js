'use strict'

const allUnitFiles = require('./lib/all-unit-files')
const operations = require('../')

const systemdListProcesses = (context) => {
  return allUnitFiles()
  .then(units => Promise.all(units.map(unit => operations.findProcess(context, unit.Unit.Description))))
}

module.exports = systemdListProcesses
