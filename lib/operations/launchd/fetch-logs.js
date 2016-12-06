'use strict'

const fs = require('fs-promise')
const path = require('path')
const operations = require('../')
const config = require('./config')
const through2 = require('through2')

module.exports = function fetchProcessLogs (context, name, onDetails, onData) {
  const logFile = path.join(config.LOG_DIR, `${name}.log`)

  return operations.findProcess(context, name)
  .then(proc => {
    fs.stat(logFile)
    .then(stats => {
      onDetails({
        path: logFile,
        size: stats.size,
        date: stats.mtime
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(logFile)
        stream.pipe(through2((chunk, enc, next) => {
          onData(chunk)

          next()
        }))
        stream.on('end', () => {
          resolve()
        })
        stream.on('error', (error) => {
          reject(error)
        })
      })
    })
  })
}
