var util = require('util')
var Actions = require('./Actions')

var Cluster = function () {
  Actions.call(this)
}
util.inherits(Cluster, Actions)

Cluster.prototype.setClusterWorkers = function (pidOrNames, workers, options) {
  workers = parseInt(workers, 10)

  if (isNaN(workers)) {
    return this._logger.error('Please pass a number for cluster workers')
  }

  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Setting cluster workers to', workers)
    managedProcess.setClusterWorkers(workers, done)
  }.bind(this))
}

module.exports = Cluster
