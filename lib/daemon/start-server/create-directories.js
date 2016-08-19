'use strict'

const config = require('../config')
const fs = require('fs-promise')

const createDirectories = (context) => {
  return Promise.all([
    fs.ensureDir(config.CONFIG_DIR)
    .then(() => fs.chmod(config.CONFIG_DIR, parseInt('0777', 8)))
    .then(() => fs.chown(config.CONFIG_DIR, process.getuid(), process.getgid())),

    fs.ensureDir(config.LOG_DIR)
    .then(() => fs.chmod(config.LOG_DIR, parseInt('0777', 8)))
    .then(() => fs.chown(config.LOG_DIR, process.getuid(), process.getgid())),

    fs.ensureDir(config.RUN_DIR)
    .then(() => fs.chmod(config.RUN_DIR, parseInt('0777', 8)))
    .then(() => fs.chown(config.RUN_DIR, process.getuid(), process.getgid())),

    fs.ensureDir(config.APP_DIR)
    .then(() => fs.chmod(config.APP_DIR, parseInt('0777', 8)))
    .then(() => fs.chown(config.APP_DIR, process.getuid(), process.getgid()))
  ])
}

module.exports = createDirectories
