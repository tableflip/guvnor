'use strict'

const config = require('../../daemon/config')
const fs = require('fs-promise')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:list-apps'

const listApps = (context) => {
  context.log([INFO, CONTEXT], 'Listing apps')

  return fs.readdir(config.APP_DIR)
  .then(dirs => Promise.all(dirs.map(dir => operations.findApp(context, dir))))
}

module.exports = listApps
