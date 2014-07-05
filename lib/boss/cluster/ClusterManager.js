var cluster = require('cluster'),
  ProcessWrapper = require('./ProcessWrapper'),
  util = require('util')

var ClusterManager = function() {
  ProcessWrapper.call(this)

  process.title = 'Cluster Master: ' + process.title

  this._numWorkers = 1
  this._workers = []

  Object.defineProperty(this, 'workers', {
    get: function() {
      return this._workers
    }.bind(this)
  })
}
util.inherits(ClusterManager, ProcessWrapper)

ClusterManager.prototype._setUp = function() {
  this._setUpProcessCallbacks()
  this._switchToUserAndGroup()

  this._numWorkers = parseInt(process.env.BOSS_NUM_PROCESSES, 10)
  delete process.env.BOSS_NUM_PROCESSES

  if(isNaN(this._numWorkers)) {
    this._numWorkers = 1
  }

  this._updateWorkers()

  cluster.on('online', function(worker) {
    console.log('worker', worker.process.pid, 'online')

    this._workers.push(worker)
  }.bind(this))
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker', worker.process.pid, 'died. code', code, 'signal', signal)

    // remove worker from list
    this._workers.splice(this._workers.indexOf(worker), 1)
  }.bind(this))

  // need to defer this until all workers are ready or a timeout occurs
  process.send({type: 'process:ready'})
}

ClusterManager.prototype._updateWorkers = function() {
  console.info('_updateWorkers')
  console.info('this._workers.length', this._workers.length, 'this._numWorkers', this._numWorkers)

  if(this._workers.length > this._numWorkers) {
    // kill some workers
    console.info('this._workers.splice(', this._numWorkers, (this._workers.length - this._numWorkers), ').forEach(function(worker) {')
    this._workers.splice(this._numWorkers, this._workers.length - this._numWorkers).forEach(function(worker) {
      worker.kill()
    })
  } else if(this._workers.length < this._numWorkers) {
    // create some workers
    for (var i = this._workers.length; i < this._numWorkers; i++) {
      cluster.fork()
    }
  }
}

ClusterManager.prototype['boss:status'] = function(event) {
  ProcessMessageHandler['boss:status'].call(this)

  this._manager.workers.forEach(function(worker) {
    worker.send('boss:status')
  })
}

ClusterManager.prototype['boss:numworkers'] = function(event) {
  this._numWorkers = isNaN(event.workers) ? 1 : event.workers

  this._updateWorkers()
}

module.exports = ClusterManager
