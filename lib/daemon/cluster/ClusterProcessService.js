var ProcessService = require('../service/ProcessService'),
  util = require('util'),
  Autowire = require('wantsit').Autowire

var ClusterProcessService = function() {
  ProcessService.call(this)

  this._parentProcess = Autowire
  this._cluster = Autowire

  // send cluster events to main boss process
  this.on('*', function() {
    this._parentProcess.send.apply(this._parentProcess, arguments)
  }.bind(this))
}
util.inherits(ClusterProcessService, ProcessService)

ClusterProcessService.prototype.afterPropertiesSet = function() {
  this._cluster.on('listening', function(worker, address) {

  }.bind(this))

  this._cluster.on('online', function(worker) {
    this._logger.info("Worker %s responded after it was forked", worker.id);

    this._processInfoStore.find('worker.id', worker.id, function(error, processInfo) {
      processInfo.status = 'starting'
    })
  }.bind(this))
}

ClusterProcessService.prototype.startProcess = function(callback) {
  this._freeport(function(error, port) {
    this._processInfoStore.create([{
      script: process.env.BOSS_SCRIPT,
      name: process.env.PROCESS_NAME,
      user: process.env.BOSS_RUN_AS_USER,
      group: process.env.BOSS_RUN_AS_GROUP,
      argv: process.argv.slice(),
      execArgv: process.execArgv.slice(),
      debug: process.env.BOSS_CLUSTER_DEBUG == 'true',
      debugPort: port
    }], function(error, processInfo) {
      if(error) return callback(error)

      this.emit('worker:starting', processInfo)

      var processOptions = processInfo.getProcessOptions()

      var originalExecArgv = process.execArgv
      process.execArgv = processOptions.execArgv
      var worker = this._cluster.fork(processOptions.env)

      process.execArgv = originalExecArgv

      processInfo.worker = worker

      this._setupProcessCallbacks(processInfo, 'worker')

      this.emit('worker:forked', processInfo)

      callback(undefined, processInfo)
    }.bind(this))
  }.bind(this))
}

ClusterProcessService.prototype.stopProcess = function(child) {
  this._logger.info('deleting child worker')
  this._processInfoStore.remove('id', child.id)

  this._logger.info('killing child worker')
  child.remote.kill()
}

module.exports = ClusterProcessService