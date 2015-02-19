var util = require('util'),
  Actions = require('./Actions')

var Cluster = function() {
  Actions.call(this)
}
util.inherits(Cluster, Actions)

Cluster.prototype.setClusterWorkers = function(pidOrName, workers, options) {
  workers = parseInt(workers, 10)

  if(isNaN(workers)) {
    return this._logger.error('Please pass a number for cluster workers')
  }

  this._do(options, function(guvnor) {
    this._withRemoteProcess(guvnor, pidOrName, function(error, processInfo, remoteProcess) {
      if(error) throw error

      remoteProcess.setClusterWorkers(workers, function(error) {
        if(error) {
          this._logger.error(error.stack ? error.stack : error.message)
        }

        remoteProcess.disconnect()
        guvnor.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = Cluster
