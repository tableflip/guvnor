'use strict'

const path = require('path')
const fs = require('fs-promise')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:remove-app'

const removeApp = (context, name) => {
  return operations.findApp(context, name)
  .then(app => {
    context.log([INFO, CONTEXT], `Removing path ${app.path}`)

    return fs.remove(app.path)
  })
}

module.exports = removeApp
