'use strict'

const watch = require('watch')
const fs = require('fs')
const path = require('path')
const operations = require('../')
const config = require('./config')
const async = require('async')
const bus = require('../../daemon/lib/event-bus')
const ERROR = require('good-enough').ERROR
const CONTEXT = 'operations:launchd:watch-process-logs'

module.exports = function launchdWatchProcessLogs (context, callback) {
  watch.createMonitor(config.LOG_DIR, function (monitor) {
    monitor.on('changed', function (file, curr, prev) {
      let processName = path.basename(file)
      processName = processName.substring(0, processName.lastIndexOf('.log'))

      async.parallel({
        process: operations.findProcess.bind(null, context, processName),
        log: readDiff.bind(null, file, prev.size, curr.size - prev.size)
      }, function (error, results) {
        if (error) {
          return context.log([ERROR, CONTEXT], error)
        }

        bus.emit('process:log', context.user, results.process, results.log)
      })
    })

    callback()
  })
}

function readDiff (file, offset, length, callback) {
  const buffer = new Buffer(length)

  fs.open(file, 'r', function (error, fd) {
    if (error) {
      return callback(error)
    }

    fs.read(fd, buffer, 0, length, offset, function (error) {
      if (error) {
        return callback(error)
      }

      fs.close(fd, function (error) {
        if (error) {
          return console.error(error)
        }

        callback(null, buffer.toString('utf8').trim())
      })
    })
  })
}
