'use strict'

const async = require('async')
const listPlists = require('./lib/list-plists')
const operations = require('../')

const findProcesses = (context, plists, next) => {
  async.parallel(plists.map((plist) => {
    return (done) => {
      operations.findProcess(context, plist.Label, done)
    }
  }), next)
}

module.exports = function launchdListProcesses (context, callback) {
  async.waterfall([
    listPlists,
    findProcesses.bind(null, context)
  ], (error, results) => {
    callback(error, error ? undefined : results)
  })
}
