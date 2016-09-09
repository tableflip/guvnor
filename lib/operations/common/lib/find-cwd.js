'use strict'

const path = require('path')
const fs = require('fs-promise')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:find-cwd'

const findDirectory = (context, script) => {
  if (!script) {
    return Promise.reject(new Error('No path specified'))
  }

  return fs.stat(script)
  .then(stats => {
    if (stats.isDirectory()) {
      return Promise.resolve(script)
    }

    return findDirectory(context, path.dirname(script))
  })
  .catch(error => {
    context.log([DEBUG, CONTEXT], 'Could not find cwd')
    context.log([DEBUG, CONTEXT], error)

    throw error
  })
}

const findCwd = (context, options) => {
  context.log([DEBUG, CONTEXT], `Finding cwd for ${options.script}`)

  return findDirectory(context, options.cwd || options.script)
  .then(cwd => {
    context.log([DEBUG, CONTEXT], `${options.script} cwd resolved to ${cwd}`)

    return cwd
  })
}

module.exports = findCwd
