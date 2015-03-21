var Autowire = require('wantsit').Autowire
var shortId = require('shortid')

var ProcessData = function (data) {
  this._config = Autowire
  this._processDataFactory = Autowire

  Object.defineProperties(this, {
    logs: {
      value: [],
      writable: true
    },
    exceptions: {
      value: [],
      writable: true
    },
    usage: {
      value: {
        heapTotal: [],
        heapUsed: [],
        residentSize: [],
        cpu: [],
        latency: []
      }
    },
    snapshots: {
      value: [],
      writable: true
    }
  })

  this.afterPropertiesSet = this.update.bind(this, data)
}

ProcessData.prototype.update = function (data) {
  this._map(data)

  if (data.heapTotal === undefined) {
    // partial data (ie. status timed out), skip appending data
    return
  }

  // memory usage is reported in bytes, round to nearest 10Kb
  this._appendUsage('heapTotal', ~~(data.heapTotal / 10000) * 10000, data.time)
  this._appendUsage('heapUsed', ~~(data.heapUsed / 10000) * 10000, data.time)
  this._appendUsage('residentSize', ~~(data.residentSize / 10000) * 10000, data.time)
  this._appendUsage('cpu', data.cpu, data.time)
  this._appendUsage('latency', Math.max(parseFloat(data.latency.toFixed(2)), 0), data.time)
}

ProcessData.prototype.log = function (type, date, message) {
  if (!type || !date || !message) {
    return
  }

  this.logs.push({
    type: type,
    date: date,
    message: message
  })

  // rotate logs if necessary
  if (this.logs.length > this._config.logs.max) {
    this.logs.splice(0, this.logs.length - this._config.logs.max)
  }
}

ProcessData.prototype.exception = function (date, message, code, stack) {
  this.exceptions.push({
    id: shortId.generate(),
    date: date,
    message: message,
    code: code,
    stack: stack
  })

  // rotate exceptions if necessary
  if (this.exceptions.length > this._config.exceptions.max) {
    this.exceptions.splice(0, this.exceptions.length - this._config.exceptions.max)
  }
}

ProcessData.prototype.snapshot = function (id, date, path, size) {
  this.snapshots.push({
    id: id,
    date: date,
    path: path,
    size: size
  })

  // rotate snapshots if necessary
  if (this.snapshots.length > this._config.snapshots.max) {
    this.snapshots.splice(0, this.snapshots.length - this._config.snapshots.max)
  }
}

ProcessData.prototype.removeSnapshot = function (id) {
  for (var i = 0; i < this.snapshots.length; i++) {
    if (this.snapshots[i].id === id) {
      this.snapshots.splice(i, 1)
      i--
    }
  }
}

ProcessData.prototype._map = function (data) {
  ['debugPort', 'gid', 'group', 'id', 'name', 'pid', 'restarts', 'script', 'uid',
    'uptime', 'user', 'status', 'heapTotal', 'heapUsed', 'residentSize', 'cpu',
    'cwd', 'argv', 'execArgv', 'latency', 'language'].forEach(function (key) {
      this[key] = data[key]
    }.bind(this))

  if (data.workers) {
    this.cluster = true

    if (!this.workers) {
      this.workers = []
    }

    var workers = []

    data.workers.forEach(function (incomingWorker) {
      var worker

      for (var i = 0; i < this.workers.length; i++) {
        if (this.workers[i].id === incomingWorker.id) {
          worker = this.workers[i]

          break
        }
      }

      if (!worker) {
        this._processDataFactory.create([incomingWorker], function (error, worker) {
          if (!error) {
            workers.push(worker)
          }
        })
      } else {
        worker.update(incomingWorker)
        workers.push(worker)
      }
    }.bind(this))

    this.workers = workers
  }

  if (data.logs) {
    data.logs.forEach(function (log) {
      this.log(log.type, log.date, log.message)
    }.bind(this))
  }
}

ProcessData.prototype._appendUsage = function (arr, usage, time) {
  if (this.usage[arr].length > this._config.graph.max) {
    this.usage[arr].splice(0, this.usage[arr].length - this._config.graph.max)
  }

  this.usage[arr].push({
    x: time,
    y: usage
  })
}

module.exports = ProcessData
