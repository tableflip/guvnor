'use strict'

const path = require('path')
const fs = require('fs-promise')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:find-cwd'

const findDirectory = (script) => {
  if (!script) {
    return Promise.reject(new Error('No path specified'))
  }

  return fs.stat(script)
  .then(stats => {
    if (stats.isDirectory()) {
      return Promise.resolve(script)
    }

    return findDirectory(path.dirname(script))
  })
}

const findCwd = (context, options) => {
  context.log([DEBUG, CONTEXT], `Starting cwd ${options.cwd} ${options.script}`)

  return findDirectory(options.cwd || options.script)
}

module.exports = findCwd
