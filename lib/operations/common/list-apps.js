'use strict'

const config = require('../../daemon/config')
const fs = require('fs-promise')
const findApp = require('./lib/find-app')

const listApps = (context) => {
  return fs.readdir(fs, config.APP_DIR)
  .then(dirs => Promise.all(dirs.map(dir => findApp(context, dir))))
}

module.exports = listApps
