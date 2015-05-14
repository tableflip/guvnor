var ProcessService = require('../service/ProcessService')
var util = require('util')
var Autowire = require('wantsit').Autowire

var ClusterProcessService = function () {
  ProcessService.call(this)

  this._parentProcess = Autowire
  this._cluster = Autowire

  // send cluster events to main guvnor process
  this.on('*', function () {
    this._parentProcess.send.apply(this._parentProcess, arguments)
  }.bind(this))
}
util.inherits(ClusterProcessService, ProcessService)

ClusterProcessService.prototype.afterPropertiesSet = function () {
  this._cluster.on('listening', function (worker, address) {})

  this._cluster.on('online', function (worker) {
    this._logger.info('Worker', worker.process.pid, 'online')

    var processInfo = this._processInfoStore.find('worker.id', worker.id)
    processInfo.status = 'starting'

    this._parentProcess.send('cluster:workers', this.listProcesses().length)
  }.bind(this))
  this._cluster.on('exit', function (worker, code, signal) {
    if (signal) {
      this._logger.info('Worker', worker.process.pid, 'died. code', code)
    } else {
      this._logger.info('Worker', worker.process.pid, 'died. code', code, 'signal', signal)
    }

    this._parentProcess.send('cluster:workers', this.listProcesses().length)
  }.bind(this))
  this._cluster.on('fork', function (worker) {
    this._logger.info('Worker', worker.process.pid, 'forked')

    var processInfo = this._processInfoStore.find('worker.id', worker.id)

    // tell guvnor we've forked a new worker
    this.emit('worker:forked', processInfo)
  }.bind(this))
  this._cluster.on('listening', function (worker) {
    this._logger.info('Worker', worker.process.pid, 'listening')
  }.bind(this))
  this._cluster.on('disconnect', function (worker) {
    this._logger.info('Worker', worker.process.pid, 'disconnected')
  }.bind(this))
}

ClusterProcessService.prototype.startProcess = function (callback) {
  var debugPort = parseInt(process.env.GUVNOR_CLUSTER_DEBUG_PORT, 10)

  this._processInfoStore.create([{
    script: process.env.GUVNOR_SCRIPT,
    name: process.env.GUVNOR_PROCESS_NAME,
    user: process.env.GUVNOR_RUN_AS_USER,
    group: process.env.GUVNOR_RUN_AS_GROUP,
    argv: process.argv.slice(),
    execArgv: process.execArgv.slice(),
    debug: process.env.GUVNOR_CLUSTER_DEBUG === 'true',
    debugPort: debugPort,
    manager: process.env.GUVNOR_CLUSTER_MANAGER
  }], function (error, processInfo) {
    if (error) return callback(error)

    // tell the guv we're about to fork a new worker
    this.emit('worker:starting', processInfo)

    var processOptions = processInfo.getProcessOptions()

    // these properties will be inherited by the worker
    this._cluster.setupMaster({
      exec: require.resolve('../process'),
      args: processInfo.getProcessArgs().slice(2) // remove path to node and the cluster module
    })

    // fork the worker
    var worker = this._cluster.fork(processOptions.env)

    // in node 0.12 and io.js the debug port is the port of the cluster manager + the worker id
    // see https://github.com/joyent/node/commit/43ec1b1c2e77d21c7571acd39860b9783aaf5175
    // in node 0.10 debugging cluster workers never really worked very well
    processInfo.debugPort = debugPort + worker.id

    // store a reference to the worker
    processInfo.worker = worker

    // make sure we listen to worker events
    this._setupProcessCallbacks(processInfo, 'worker')

    callback(undefined, processInfo)
  }.bind(this))
}

ClusterProcessService.prototype.stopProcess = function (child) {
  this._logger.info('deleting child worker')
  this._processInfoStore.remove('id', child.id)

  this._logger.info('killing child worker')
  child.remote.kill()
}

module.exports = ClusterProcessService
