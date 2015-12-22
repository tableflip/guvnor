var async = require('async')
var fs = require('fs')
var path = require('path')
var crypto = require('crypto')

var EXTENSION = '.heapsnapshot'

module.exports = function listHeapSnapshots (callback) {
  async.waterfall([
    fs.readdir.bind(null, process.cwd()),
    function readFiles (files, next) {
      next(null, files.filter(function filterFilesByExtension (file) {
        return file.substring(file.length - EXTENSION.length) === EXTENSION
      }))
    },
    function prependPath (files, next) {
      next(null, files.map(function (file) {
        return path.join(process.cwd(), file)
      }))
    },
    function statFiles (files, next) {
      async.map(files, function (file, done) {
        fs.stat(file, function (error, stats) {
          if (!error) {
            stats.path = file
          }

          done(error, stats)
        })
      }, next)
    },
    function mapFiles (stats, next) {
      next(null, stats.map(function (stat) {
        return {
          id: crypto.createHash('md5').update(stat.path).digest('hex'),
          date: stat.birthtime.getTime(),
          path: stat.path,
          size: stat.size
        }
      }))
    }
  ], callback)
}
