'use strict'

const allUnitFiles = require('./lib/all-unit-files')
const operations = require('../')

const systemdListProcessesDetails = (context) => {
  return allUnitFiles(context)
  .then(units => Promise.all(units.map(unit => operations.findProcessDetails(context, unit.Unit.Description))))
}

module.exports = systemdListProcessesDetails
