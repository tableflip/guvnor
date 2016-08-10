'use strict'

const async = require('async')
const listPlists = require('../list-plists')
const loadPlist = require('./load-plist')

module.exports = function launchdAllProcessPlists (callback) {
  async.waterfall([
    listPlists,
    function loadPlists (files, next) {
      async.map(files, loadPlist, next)
    }
  ], callback)
}
