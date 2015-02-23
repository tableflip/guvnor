var Autowire = require('wantsit').Autowire,
  semver = require('semver'),
  async = require('async')

var HostData = function(name, data) {
  this._logger = Autowire
  this._config = Autowire
  this._processDataFactory = Autowire
  this._webSocketResponder = Autowire
  this._remote = Autowire

  this.name = name
  this.host = data.host
  this.lastUpdated = Date.now()
  this.users = []
  this.groups = []

  Object.defineProperties(this, {
    'processes': {
      value: [],
      writable: true
    },
    'apps': {
      value: [],
      writable: true
    },
    'port': {
      value: data.port
    },
    '_data': {
      value: data
    },
    '_daemon': {
      value: null,
      writable: true
    },
    '_updateServerStatusTimeout': {
      value: null,
      writable: true
    },
    '_updateProcessesTimeout': {
      value: null,
      writable: true
    },
    '_timeoutThreshold': {
      value: 60000
    }
  })
}

HostData.prototype.afterPropertiesSet = function() {
  this._connectToDaemon()
}

HostData.prototype._connectToDaemon = function() {
  this.status = 'connecting'

  this._remote(this._logger, this._data, this._connectedToDaemon.bind(this))
}

HostData.prototype._connectedToDaemon = function(error, guvnor) {
  if(error) {
    if(error.code == 'CONNECTIONREFUSED') {
      this.status = 'connectionrefused'
    } else if(error.code == 'CONNECTIONRESET') {
      this.status = 'connectionreset'
    } else if(error.code == 'HOSTNOTFOUND') {
      this.status = 'hostnotfound'
    } else if(error.code == 'TIMEDOUT') {
      this.status = 'connectiontimedout'
    } else if(error.code == 'NETWORKDOWN') {
      this.status = 'networkdown'
    } else {
      this._logger.error('Error connecting to guvnor', this._data.host, this._data.port, this._data.user)
      this._logger.error('Message', error.message)
      this._logger.error('Code', error.code)
      this._logger.error('Stack', error.stack)

      this.status = 'error'
    }

    return
  }

  if(this._daemon) {
    // remove previous listener
    this._daemon.off('disconnected')
  }

  this._daemon = guvnor

  // listen for disconnection
  this._daemon.once('disconnected', function() {
    this._daemon.off('*')
    this._daemon.off('process:uncaughtexception')
    this._daemon.off('process:failed')
    this._daemon.off('process:starting')
    this._daemon.off('process:log:*')
    this._daemon.off('cluster:log:*')
    this._daemon.off('worker:log:*')

    clearTimeout(this._updateServerStatusTimeout)
    clearTimeout(this._updateProcessesTimeout)

    this.status = 'connecting'
  }.bind(this))

  this._daemon.getDetails(function(error, details) {
    if (error) {
      this._logger.error('Error getting guvnor details', error)
      this._handleRemoteError(error)

      return
    }

    for (var key in details) {
      this[key] = details[key]
    }

    if (!semver.satisfies(details.guvnor || details.boss, this._config.minVersion)) {
      this.status = 'incompatible'

      // tell everyone we are incompatible
      var broadcast = function() {
        this._webSocketResponder.broadcast('server:status', this.name, this)

        setTimeout(broadcast, this._config.frequency).unref()
      }.bind(this)
      broadcast()

      return
    }

    this.status = 'connected'

    // update details
    this._update('getServerStatus', this._handleUpdatedServerStatus, '_updateServerStatusTimeout')
    this._update('listProcesses', this._handleUpdatedProcesses, '_updateProcessesTimeout')

    this._daemon.on('process:log:*', function(type, process, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.log(type.split(':')[2], event.date, event.message)
    }.bind(this))

    this._daemon.on('cluster:log:*', function(type, cluster, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.log(type.split(':')[2], event.date, event.message)
    }.bind(this))

    this._daemon.on('worker:log:*', function(type, cluster, process, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.log(type.split(':')[2], event.date, event.message)
    }.bind(this))

    this._daemon.on('process:uncaughtexception', function(process, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.exception(event.date, event.message, event.code, event.stack)
    }.bind(this))

    this._daemon.on('process:failed', function(process, error) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.exception(error.date, error.message, error.code, error.stack)
    }.bind(this))

    this._daemon.on('process:starting', this._createOrUpdateProcess.bind(this))

    this._daemon.on('*', function() {
      var args = Array.prototype.slice.call(arguments)
      args.splice(1, 0, this.name)

      this._webSocketResponder.broadcast.apply(this._webSocketResponder, args)
    }.bind(this))

  }.bind(this))
}

HostData.prototype._handleRemoteError = function(error) {
  if(error.code == 'TIMEOUT') {
    if((Date.now() - this.lastUpdated) < this._timeoutThreshold) {
      // saw a different update in the last minute, ignore this timeout
      this._logger.info('Ignoring update processes timeout for %s as we saw an update %ss ago', this.name, (Date.now() - this.lastUpdated) / 1000)
    } else {
      this.status = 'timeout'
    }
  } else if(error.code == 'INVALIDSIGNATURE') {
    this.status = 'badsignature'
  } else {
    this.status = 'error'
  }
}

HostData.prototype._update = function(method, update, timeoutName) {
  var retry = function() {
    if(this[timeoutName]) {
      clearTimeout(this[timeoutName])
    }

    this[timeoutName] = setTimeout(this._update.bind(this, method, update, timeoutName), this._config.frequency)
    this[timeoutName].unref()
  }.bind(this)

  this._daemon[method](function(error) {
    if(error) {
      this._handleRemoteError(error)
      retry()
      this._logger.error('Error getting guvnor status from', this.name, error)
    } else {
      if(this.status == 'timeout') {
        this._logger.info(this.name, 'came back!')
      }

      this.status = 'connected'
      this.lastUpdated = Date.now()

      var args = Array.prototype.slice.call(arguments, 1)
      args.push(retry)

      update.apply(this, args)
    }
  }.bind(this))
}

HostData.prototype._handleUpdatedServerStatus = function(status, callback) {
  for(var key in status) {
    this[key] = status[key]
  }

  this._webSocketResponder.broadcast('server:status', this.name, this)

  callback()
}

HostData.prototype._handleUpdatedProcesses = function(processes, callback) {
  this._removeMissingProcesses(processes)

  var tasks = processes.map(function(data) {
    return this._createOrUpdateProcess.bind(this, data)
  }.bind(this))

  async.parallel(tasks, function(error) {
    this._webSocketResponder.broadcast('server:processes', this.name, this.processes)

    callback(error)
  }.bind(this))
}

HostData.prototype._createOrUpdateProcess = function(data, callback) {
  var existingProcess = this.findProcessById(data.id);

  if(!existingProcess) {
    this._processDataFactory.create([data], function(error, newProcess) {
      this.processes.push(newProcess)

      if(callback) {
        callback()
      }
    }.bind(this))
  } else {
    existingProcess.update(data)

    if(callback) {
      callback()
    }
  }
}

HostData.prototype._removeMissingProcesses = function(reportedProcesses) {
  this.processes = this.processes.filter(function(existingProcess) {
    for(var i = 0; i < reportedProcesses.length; i++) {
      if(reportedProcesses[i].id == existingProcess.id) {
        return true
      }
    }

    return false
  })
}

HostData.prototype.findApps = function(callback) {
  if(!this._daemon) {
    return callback(undefined, [])
  }

  this._daemon.listApplications(callback)
}

HostData.prototype.findProcessById = function(id) {
  for(var i = 0; i < this.processes.length; i++) {
    var proc = this.processes[i]

    if(proc.id == id) {
      return proc
    }

    if(proc.workers) {
      for(var n = 0; n < proc.workers.length; n++) {
        if(proc.workers[n].id == id) {
          return proc.workers[n]
        }
      }
    }
  }

  return null
}

module.exports = HostData
