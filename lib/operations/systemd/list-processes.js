'use strict'

const async = require('async')
const allUnitFiles = require('./lib/all-unit-files')
const operations = require('../')

const findProcesses = (context, units, next) => {
  async.parallel(units.map((unit) => {
    return (done) => {
      operations.findProcess(context, unit.Unit.Description, done)
    }
  }), next)
}

module.exports = function systemdListProcesses (context, callback) {
  async.waterfall([
    allUnitFiles,
    findProcesses.bind(null, context)
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
