'use strict'

const watch = require('watch')
const fs = require('fs')
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
        .then((results) => {
          const proc = results[0]
          const log = results[1]

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

    fs.open(file, 'r', function (error, fd) {
      if (error) {
        return reject(error)
      }

      fs.read(fd, buffer, 0, length, offset, function (error) {
        if (error) {
          return reject(error)
        }

        fs.close(fd, function (error) {
          if (error) {
            return console.error(error)
          }

          resolve(buffer.toString('utf8').trim())
        })
      })
    })
  })
}

module.exports = launchdWatchProcessLogs
