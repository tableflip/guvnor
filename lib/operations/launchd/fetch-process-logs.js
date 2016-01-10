var fs = require('fs')
var async = require('async')
var path = require('path')
var operations = require('../')
var config = require('./config')
var through2 = require('through2')

module.exports = function fetchProcessLogs (context, name, onDetails, onData, callback) {
  var logFile = path.join(config.LOG_DIR, name + '.log')

  async.waterfall([
    operations.findProcess.bind(null, context, name),
    function readStats (proc, next) {
      fs.stat(logFile, next)
    },
    function didReadStats (stats, next) {
      onDetails({
        path: logFile,
        size: stats.size,
        date: stats.mtime
      })

      next()
    },
    function streamFile (next) {
      var stream = fs.createReadStream(logFile)
      stream.pipe(through2(function (chunk, enc, next) {
        onData(chunk)

        next()
      }))
      stream.on('end', next)
    }
  ], function (error) {
    callback(error)
  })
}
