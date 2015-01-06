var Autowire = require('wantsit').Autowire,
  uuid = require('uuid')

var ProcessData = function(data) {
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
        cpu: []
      }
    }
  })

  this.afterPropertiesSet = this._map.bind(this, data)
}

ProcessData.prototype.update = function(data) {
  this._map(data)

  if(data.heapTotal === undefined) {
    // partial data (ie. status timed out), skip appending data
    return
  }

  // memory usage is reported in bytes so round it down otherwise
  // we exhaust our datapoint limit really quickly...
  this._appendUsage('heapTotal', ~~(data.heapTotal / 10000) * 10000, data.time)
  this._appendUsage('heapUsed', ~~(data.heapUsed / 10000) * 10000, data.time)
  this._appendUsage('residentSize', ~~(data.residentSize / 10000) * 10000, data.time)
  this._appendUsage('cpu', data.cpu, data.time)
}

ProcessData.prototype.log = function(type, date, message) {
  if(!type || !date || !message) {
    return
  }

  this.logs.push({
    type: type,
    date: date,
    message: message
  })

  // rotate logs if necessary
  if(this.logs.length > this._config.logs.max) {
    this.logs.splice(0, this.logs.length - this._config.logs.max)
  }
}

ProcessData.prototype.exception = function(date, message, code, stack) {
  this.exceptions.push({
    id: uuid.v4(),
    date: date,
    message: message,
    code: code,
    stack: stack
  })

  // rotate exceptions if necessary
  if(this.exceptions.length > this._config.exceptions.max) {
    this.exceptions.splice(0, this.exceptions.length - this._config.exceptions.max)
  }
}

ProcessData.prototype._map = function(data) {
  ["debugPort", "gid", "group", "id", "name", "pid", "restarts", "script", "uid",
    "uptime", "user", "status", "heapTotal", "heapUsed", "residentSize", "cpu",
    "cwd", "argv", "execArgv"].forEach(function(key) {
    this[key] = data[key]
  }.bind(this))

  if(data.workers) {
    this.cluster = true

    if(!this.workers) {
      this.workers = []
    }

    var workers = []

    data.workers.forEach(function(incomingWorker) {
      var worker

      for(var i = 0; i < this.workers.length; i++) {
        if(this.workers[i].id == incomingWorker.id) {
          worker = this.workers[i]

          break
        }
      }

      if(!worker) {
        this._processDataFactory.create(incomingWorker, function(error, worker) {
          workers.push(worker)

          worker.update(incomingWorker)
        }.bind(this))
      } else {
        workers.push(worker)
        worker.update(incomingWorker)
      }
    }.bind(this))

    this.workers = workers
  }

  if(data.logs) {
    data.logs.forEach(function(log) {
      this.log(log.type, log.date, log.message)
    }.bind(this))
  }
}

ProcessData.prototype._appendUsage = function(arr, usage, time) {
  if(this.usage[arr].length > this._config.graph.max) {
    this.usage[arr].splice(0, this.usage[arr].length - this._config.graph.max)
  }

  this.usage[arr].push({
    date: time,
    usage: usage
  })
}

module.exports = ProcessData
