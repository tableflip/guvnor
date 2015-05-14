var ProcessWrapper = require('../process/ProcessWrapper')
var util = require('util')
var async = require('async')

var ClusterProcessWrapper = function () {
  ProcessWrapper.call(this)
}
util.inherits(ClusterProcessWrapper, ProcessWrapper)

ClusterProcessWrapper.prototype.afterPropertiesSet = function () {
  async.series([
    this._setProcessName.bind(this),
    this._processRpc.startDnodeServer.bind(this._processRpc)
  ], this._done.bind(this))
}

ClusterProcessWrapper.prototype._setProcessName = function (callback) {
  ProcessWrapper.prototype._setProcessName.call(this, function () {
    process.title = 'Cluster: ' + process.title

    callback()
  })
}

ClusterProcessWrapper.prototype._done = function (error, results) {
  if (error) {
    return this._parentProcess.send('cluster:failed', {
      date: Date.now(),
      message: error.message,
      code: error.code,
      stack: error.stack
    })
  }

  // pass rpc socket path to parent process
  this._parentProcess.send('cluster:started', results[1])
}

module.exports = ClusterProcessWrapper
