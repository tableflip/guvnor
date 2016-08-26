'use strict'

const config = require('../../daemon/config')
const fs = require('fs-promise')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:list-apps'
const explode = require('../../common/explode')

const listApps = (context) => {
  context.log([INFO, CONTEXT], 'Listing apps')

  return fs.readdir(config.APP_DIR)
  .then(dirs => Promise.all(
    dirs.map(dir => operations.findApp(context, dir).catch(error => {
      if (error.code === explode.EINVALIDAPP) {
        // could be in the process of being created by another request
        return null
      }

      throw error
    }))
  ))
  .then(apps => apps.filter(app => !!app))
}

module.exports = listApps
