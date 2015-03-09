var Autowire = require('wantsit').Autowire
var async = require('async')

var ClusterManager = function () {
  this._processService = Autowire
  this._os = Autowire
  this._cluster = Autowire
  this._logger = Autowire
  this._parentProcess = Autowire

  this._numWorkers = 1

  Object.defineProperty(this, 'workers', {
    get: function () {
      return this._processService.listProcesses()
    }.bind(this)
  })
}

ClusterManager.prototype.afterPropertiesSet = function (done) {
  async.series([
    this._findNumWorkers.bind(this),
    this._updateWorkers.bind(this)
  ], done)
}

ClusterManager.prototype._findNumWorkers = function (callback) {
  this._numWorkers = parseInt(process.env.GUVNOR_NUM_PROCESSES, 10)
  delete process.env.GUVNOR_NUM_PROCESSES

  if (isNaN(this._numWorkers)) {
    this._numWorkers = 1
  }

  callback()
}

ClusterManager.prototype._updateWorkers = function (callback) {
  var children = this._processService.listProcesses()

  if (children.length > this._numWorkers) {
    var tasks = []

    // kill some workers
    children.splice(this._numWorkers, children.length - this._numWorkers).forEach(function (child) {
      this._parentProcess.send('worker:stopping', child)

      this._processService.stopProcess(child)

      tasks.push(function(callback) {
        this._processService.once('worker:exit', function() {
          callback()
        })
      }.bind(this))
    }.bind(this))

    async.parallel(tasks, function(error) {
      if (error) {
        this._logger.error(error)
      }

      process.nextTick(function () {
        this._parentProcess.send('cluster:online')
      }.bind(this))
    }.bind(this))

    return callback()
  } else if (children.length < this._numWorkers) {
    var workers = this._numWorkers - children.length

    this._logger.info('Creating %d new worker(s)', workers)

    var decrement = function () {
      workers--

      this._logger.info('%d new worker(s) to go', workers)

      if (workers === 0) {
        process.nextTick(function () {
          this._parentProcess.send('cluster:online')
        }.bind(this))
      }
    }.bind(this)

    // create some workers
    async.timesSeries(workers, this._createWorker.bind(this), function (error, results) {
      if (error) return callback(error)

      results.forEach(function (processInfo) {
        this._logger.info('Worker started with pid', processInfo.pid)

        var listener = function (readyProcessInfo) {
          if (readyProcessInfo.id !== processInfo.id) {
            return
          }

          decrement()

          this._processService.off('worker:ready', listener)
        }.bind(this)

        this._processService.on('worker:ready', listener)
      }.bind(this))

      callback()
    }.bind(this))
  } else {
    // already got the right number of children
    callback()
  }
}

ClusterManager.prototype._createWorker = function (index, callback) {
  this._processService.startProcess(callback)
}

ClusterManager.prototype.setNumWorkers = function (workers, callback) {
  if (!workers) {
    workers = this._numWorkers
  }

  this._numWorkers = workers

  var maxWorkers = this._os.cpus().length - 1

  if (this._numWorkers > maxWorkers) {
    this._numWorkers = maxWorkers
  }

  this._logger.info('Set workers to', this._numWorkers)
  this._updateWorkers(callback)
}

module.exports = ClusterManager
