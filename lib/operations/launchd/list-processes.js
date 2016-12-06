'use strict'

const allPlists = require('./lib/all-plists')
const operations = require('../')

const launchdListProcesses = (context) => {
  return allPlists()
  .then(plists => Process.all(
    plists.map(plist => operations.findProcess(context, plist.Label))
  ))
}

module.exports = launchdListProcesses
