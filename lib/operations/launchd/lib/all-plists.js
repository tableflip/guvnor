'use strict'

const listPlists = require('./list-plists')
const loadPlist = require('./load-plist')

const launchdAllProcessPlists = () => {
  return listPlists()
  .then(plists => Promise.all(
    plists.map(plist => loadPlist(plist))
  ))
}

module.exports = launchdAllProcessPlists
