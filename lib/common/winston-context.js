'use strict'

const format = require('good-enough/transforms/format')
const logger = require('winston')
const ERROR = require('good-enough').ERROR
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG
const os = require('os')

const context = {
  id: 'winston',
  user: {
    uid: os.userInfo().uid,
    gid: os.userInfo().gid,
    name: os.userInfo().username,
    home: os.userInfo().homedir,
    group: os.userInfo().username,
    groups: [os.userInfo().username]
  },
  log: (tags, message) => {
    message = format({
      timestamp: Date.now(),
      pid: process.pid,
      tags: tags,
      message: message
    }).trim()

    if (tags.includes(ERROR)) {
      logger.error(message)
    } else if (tags.includes(WARN)) {
      logger.warn(message)
    } else if (tags.includes(DEBUG)) {
      logger.debug(message)
    } else {
      logger.info(message)
    }
  }
}

module.exports = () => Promise.resolve(context)
