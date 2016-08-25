'use strict'

const path = require('path')
const fs = require('fs-promise')
const config = require('../../daemon/config')
const operations = require('../')

const removeApp = (context, name) => {
  return operations.findApp(context, name)
  .then(app => (app) => {
    const doomed = path.resolve(path.join(config.APP_DIR, app.name))

    if (doomed.substring(0, config.APP_DIR.length) !== config.APP_DIR || doomed === config.APP_DIR) {
      throw new Error('Invalid path')
    }

    return fs.remove(doomed)
  })
}

module.exports = removeApp
