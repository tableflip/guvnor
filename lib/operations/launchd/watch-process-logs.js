'use strict'

const watch = require('watch')
const fs = require('fs-promise')
const path = require('path')
const operations = require('../')
const config = require('./config')
const bus = require('../../daemon/lib/event-bus')
const ERROR = require('good-enough').ERROR
const CONTEXT = 'operations:launchd:watch-process-logs'

const launchdWatchProcessLogs = (context) => {
  return new Promise((resolve, reject) => {
    watch.createMonitor(config.LOG_DIR, (monitor) => {
      monitor.on('changed', function (file, curr, prev) {
        let processName = path.basename(file)
        processName = processName.substring(0, processName.lastIndexOf('.log'))

        Promise.all([
          operations.findProcess(context, processName),
          readDiff(file, prev.size, curr.size - prev.size)
        ])
        .then(([proc, log]) => {
          bus.emit('process:log', context.user, proc, log)
        })
        .catch(error => {
          context.log([ERROR, CONTEXT], error)
        })
      })

      resolve()
    })
  })
}

const readDiff = (file, offset, length) => {
  return new Promise((resolve, reject) => {
    const buffer = new Buffer(length)

    fs.open(file, 'r')
    .then(fd => {
      return fs.read(fd, buffer, 0, length, offset)
      .then(() => fs.close(fd))
      .then(() => resolve(buffer.toString('utf8').trim()))
    })
    .catch(error => reject(error))
  })
}

module.exports = launchdWatchProcessLogs
