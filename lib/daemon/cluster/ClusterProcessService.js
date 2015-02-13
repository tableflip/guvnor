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
    this._logger.info('Worker', worker.process.pid, 'online')

    var processInfo = this._processInfoStore.find('worker.id', worker.id)
    processInfo.status = 'starting'
  }.bind(this))
  this._cluster.on('exit', function(worker, code, signal) {
    if(signal) {
      this._logger.info('Worker', worker.process.pid, 'died. code', code)
    } else {
      this._logger.info('Worker', worker.process.pid, 'died. code', code, 'signal', signal)
    }
  }.bind(this))
  this._cluster.on('fork', function(worker) {
    this._logger.info('Worker', worker.process.pid, 'forked')

    var processInfo = this._processInfoStore.find('worker.id', worker.id)

    // tell boss we've forked a new worker
    this.emit('worker:forked', processInfo)
  }.bind(this))
  this._cluster.on('listening', function(worker) {
    this._logger.info('Worker', worker.process.pid, 'listening')
  }.bind(this))
  this._cluster.on('disconnect', function(worker) {
    this._logger.info('Worker', worker.process.pid, 'disconnected')
  }.bind(this))
}

ClusterProcessService.prototype.startProcess = function(callback) {
  this._freeport(function(error, port) {
    this._processInfoStore.create([{
      script: process.env.BOSS_SCRIPT,
      name: process.env.BOSS_PROCESS_NAME,
      user: process.env.BOSS_RUN_AS_USER,
      group: process.env.BOSS_RUN_AS_GROUP,
      argv: process.argv.slice(),
      execArgv: process.execArgv.slice(),
      debug: process.env.BOSS_CLUSTER_DEBUG == 'true',
      debugPort: port
    }], function(error, processInfo) {
      if(error) return callback(error)

      // tell boss we're about to fork a new worker
      this.emit('worker:starting', processInfo)

      var processOptions = processInfo.getProcessOptions()

      // these properties will be inherited by the worker
      this._cluster.setupMaster({
        exec: require.resolve('../process'),
        args: processInfo.getProcessArgs().slice(2) // remove path to node and the cluster module
      })

      // make sure we only pass expected v8 args to worker
      var originalExecArgv = process.execArgv
      process.execArgv = processOptions.execArgv

      // fork the worker
      var worker = this._cluster.fork(processOptions.env)

      // restore original v8 args to this process
      process.execArgv = originalExecArgv

      // store a reference to the worker
      processInfo.worker = worker

      // make sure we listen to worker events
      this._setupProcessCallbacks(processInfo, 'worker')

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