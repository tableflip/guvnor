'use strict'

const allPlists = require('./lib/all-plists')
const operations = require('../')

const launchdListProcessDetails = (context) => {
  return allPlists()
  .then(plists => Promise.all(
    plists.map(plist => operations.findProcessDetails(context, plist.Label))
  ))
}

module.exports = launchdListProcessDetails
