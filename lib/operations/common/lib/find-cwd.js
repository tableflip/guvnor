'use strict'

const path = require('path')
const fs = require('fs')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'operations:common:lib:find-cwd'

function findDirectory (script, callback) {
  if (!script) {
    return callback(new Error('No path specified'))
  }

  fs.stat(script, function (error, stats) {
    if (error) {
      return callback(error)
    }

    if (stats.isDirectory()) {
      return callback(null, script)
    }

    findDirectory(path.dirname(script), callback)
  })
}

module.exports = function launchdFindCwd (context, options, callback) {
  context.log([DEBUG, CONTEXT], `Starting cwd ${options.cwd} ${options.script}`)

  findDirectory(options.cwd || options.script, function (error, cwd) {
    context.log([DEBUG, CONTEXT], `Final cwd ${cwd}`)

    options.cwd = cwd

    callback(error, context, options)
  })
}
