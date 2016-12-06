'use strict'

const format = require('good-enough/transforms/format')
const operations = require('../operations')
const logger = require('winston')
const INFO = require('good-enough').INFO
const ERROR = require('good-enough').ERROR
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG

const context = {
  id: 'global',
  user: {
    name: 'root',
    scope: ['admin'],
    uid: process.getuid(),
    gid: process.getgid(),
    home: '/var/root',
    group: 'root',
    groups: ['root']
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

const createGlobalContextPromise = operations.findUserDetails(context, process.getuid())
.then(user => {
  context.user = user

  return context
})

module.exports = () => createGlobalContextPromise
