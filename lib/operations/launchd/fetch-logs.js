'use strict'

const fs = require('fs-promise')
const path = require('path')
const operations = require('../')
const config = require('./config')
const through2 = require('through2')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:launchd:fetch-logs'

const fetchLogs = (context, options) => {
  return new Promise((resolve, reject) => {
    return operations.findProcess(context, options.script)
    .then(proc => {
      const logFile = path.join(config.LOG_DIR, `${proc.name}.log`)

      context.log([INFO, CONTEXT], `Streaming ${logFile}`)

      fs.stat(logFile)
      .then(stats => {
        return {
          details: {
            path: logFile,
            size: stats.size,
            date: stats.mtime
          },
          stream: fs.createReadStream(logFile)
        }
      })
    })
  })
}

module.exports = fetchLogs
