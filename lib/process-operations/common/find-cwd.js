var path = require('path')
var fs = require('fs')
var logger = require('winston')

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

module.exports = function launchdFindCwd (user, options, callback) {
  logger.debug('Starting cwd', options.cwd, options.script)

  findDirectory(options.cwd || options.script, function (error, cwd) {
    logger.debug('Final cwd', cwd, error)

    options.cwd = cwd

    callback(error, user, options)
  })
}
