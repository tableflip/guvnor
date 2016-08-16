'use strict'

const async = require('async')
const config = require('../config')
const mkdirp = require('mkdirp')
const fs = require('fs')

module.exports = function createDirectories (callback) {
  async.auto({
    // create directories
    config_dir: async.apply(mkdirp, config.CONFIG_DIR, parseInt('0777', 8)),
    log_dir: async.apply(mkdirp, config.LOG_DIR, parseInt('0777', 8)),
    run_dir: async.apply(mkdirp, config.RUN_DIR, parseInt('0777', 8)),
    app_dir: async.apply(mkdirp, config.APP_DIR, parseInt('0777', 8)),

    // change permissions of directories
    chmod_config_dir: ['config_dir', (results, next) => {
      fs.chmod(config.CONFIG_DIR, parseInt('0777', 8), next)
    }],
    chmod_log_dir: ['log_dir', (results, next) => {
      fs.chmod(config.LOG_DIR, parseInt('0777', 8), next)
    }],
    chmod_run_dir: ['run_dir', (results, next) => {
      fs.chmod(config.RUN_DIR, parseInt('0777', 8), next)
    }],
    chmod_app_dir: ['app_dir', (results, next) => {
      fs.chmod(config.APP_DIR, parseInt('0777', 8), next)
    }],

    // change owner of directories
    chown_config_dir: ['config_dir', (results, next) => {
      fs.chown(config.CONFIG_DIR, process.getuid(), process.getgid(), next)
    }],
    chown_log_dir: ['log_dir', (results, next) => {
      fs.chown(config.LOG_DIR, process.getuid(), process.getgid(), next)
    }],
    chown_run_dir: ['run_dir', (results, next) => {
      fs.chown(config.RUN_DIR, process.getuid(), process.getgid(), next)
    }],
    chown_app_dir: ['app_dir', (results, next) => {
      fs.chown(config.APP_DIR, process.getuid(), process.getgid(), next)
    }]
  }, callback)
}
