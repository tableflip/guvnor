
var async = require('async')
var config = require('../config')
var mkdirp = require('mkdirp')
var fs = require('fs')

module.exports = function createDirectories (callback) {
  async.auto({
    // create directories
    config_dir: mkdirp.bind(null, config.CONFIG_DIR, parseInt('0700', 8)),
    log_dir: mkdirp.bind(null, config.LOG_DIR, parseInt('0777', 8)),
    run_dir: mkdirp.bind(null, config.RUN_DIR, parseInt('0777', 8)),
    process_run_dir: ['run_dir', mkdirp.bind(null, config.PROCESS_RUN_DIR, parseInt('0777', 8))],
    app_dir: mkdirp.bind(null, config.APP_DIR, parseInt('0777', 8)),

    // change permissions of directories
    chmod_config_dir: ['config_dir', fs.chmod.bind(null, config.CONFIG_DIR, parseInt('0700', 8))],
    chmod_log_dir: ['log_dir', fs.chmod.bind(null, config.LOG_DIR, parseInt('0777', 8))],
    chmod_run_dir: ['run_dir', fs.chmod.bind(null, config.RUN_DIR, parseInt('0777', 8))],
    chmod_process_run_dir: ['process_run_dir', fs.chmod.bind(null, config.PROCESS_RUN_DIR, parseInt('0777', 8))],
    chmod_app_dir: ['app_dir', fs.chmod.bind(null, config.APP_DIR, parseInt('0777', 8))],

    // change owner of directories
    chown_config_dir: ['config_dir', fs.chown.bind(null, config.CONFIG_DIR, process.getuid(), process.getgid())],
    chown_log_dir: ['log_dir', fs.chown.bind(null, config.LOG_DIR, process.getuid(), process.getgid())],
    chown_run_dir: ['run_dir', fs.chown.bind(null, config.RUN_DIR, process.getuid(), process.getgid())],
    chown_process_run_dir: ['process_run_dir', fs.chown.bind(null, config.PROCESS_RUN_DIR, process.getuid(), process.getgid())],
    chown_app_dir: ['app_dir', fs.chown.bind(null, config.APP_DIR, process.getuid(), process.getgid())]
  }, callback)
}
