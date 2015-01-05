var Autowire = require('wantsit').Autowire,
  async = require('async')

var ClusterManager = function() {
  this._processService = Autowire
  this._os = Autowire
  this._cluster = Autowire
  this._logger = Autowire
  this._parentProcess = Autowire

  this._numWorkers = 1

  Object.defineProperty(this, 'workers', {
    get: function() {
      return this._processService.listProcesses()
    }.bind(this)
  })
}

ClusterManager.prototype.afterPropertiesSet = function(done) {
  async.series([
    this._setUpClusterCallbacks.bind(this),
    this._findNumWorkers.bind(this),
    this._updateWorkers.bind(this)
  ], done)
}

ClusterManager.prototype._findNumWorkers = function(callback) {
  this._numWorkers = parseInt(process.env.BOSS_NUM_PROCESSES, 10)
  delete process.env.BOSS_NUM_PROCESSES

  if (isNaN(this._numWorkers)) {
    this._numWorkers = 1
  }

  callback()
}

ClusterManager.prototype._setUpClusterCallbacks = function(callback) {
  this._cluster.on('online', function(worker) {
    this._logger.info('worker', worker.process.pid, 'online')
  }.bind(this))
  this._cluster.on('exit', function(worker, code, signal) {
    this._logger.info('worker', worker.process.pid, 'died. code', code, 'signal', signal)
  }.bind(this))

  callback()
}

ClusterManager.prototype._updateWorkers = function(callback) {
  var children = this._processService.listProcesses()

  if(children.length > this._numWorkers) {
    // kill some workers
    children.splice(this._numWorkers, children.length - this._numWorkers).forEach(function(child) {
      this._parentProcess.send('worker:stopping', child)

      this._processService.stopProcess(child)
    }.bind(this))

    return callback()
  } else if(children.length < this._numWorkers) {
    var workers = this._numWorkers - children.length

    this._logger.info('Creating %d new workers', workers)

    var decrement = function() {
      workers--

      this._logger.info('%d new workers to go', workers)

      if(workers === 0) {
        process.nextTick(function() {
          this._parentProcess.send('cluster:online')
        }.bind(this))
      }
    }.bind(this)

    // create some workers
    async.timesSeries(workers, this._createWorker.bind(this), function(error, results) {
      if(error) return callback(error)

      results.forEach(function(processInfo) {
        this._logger.info('Worker started with pid', processInfo.pid)

        // memory leak here! need to deregister this listener...
        this._processService.on('worker:ready', function(readyProcessInfo) {
          if(readyProcessInfo.id != processInfo.id) {
            return
          }

          //this._parentProcess.send('worker:ready', processInfo)

          decrement()
        })
      }.bind(this))

      callback()
    }.bind(this))
  } else {
    // already got the right number of children
    callback()
  }
}

ClusterManager.prototype._createWorker = function(index, callback) {
  this._processService.startProcess(callback)
}

ClusterManager.prototype.setNumWorkers = function(workers, callback) {
  if(!workers) {
    workers = this._numWorkers
  }

  this._numWorkers = workers

  var maxWorkers = this._os.cpus().length - 1

  if(this._numWorkers > maxWorkers) {
    this._numWorkers = maxWorkers
  }

  this._logger.info('Set workers to', this._numWorkers)
  this._updateWorkers(callback)
}

module.exports = ClusterManager
