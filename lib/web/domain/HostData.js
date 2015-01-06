var Autowire = require('wantsit').Autowire,
  remote = require('../../remote'),
  semver = require('semver')

var HostData = function(name, data) {
  this._logger = Autowire
  this._config = Autowire
  this._processDataFactory = Autowire
  this._webSocketResponder = Autowire

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
    '_data': {
      value: data
    },
    '_remote': {
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
  setInterval(function() {
    if(this.status == 'connected') {
      return
    }

    this._webSocketResponder.broadcast('server:status', this.name, this)
  }.bind(this), this._config.frequency)

  this.status = 'connecting'

  this._connectToDaemon()
}

HostData.prototype._connectToDaemon = function() {
  this.status = 'connecting'

  remote(this._logger, this._data, this._connectedToDaemon.bind(this))
}

HostData.prototype._connectedToDaemon = function(error, boss) {
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
      this._logger.error('Error connecting to boss', error.code)

      this.status = 'error'
    }

    return
  }

  if(this._remote) {
    // remove previous listener
    this._remote.off('disconnected')
  }

  this._remote = boss

  // listen for disconnection
  this._remote.once('disconnected', function() {
    this._remote.off('*')
    this._remote.off('process:log:*')
    this._remote.off('process:uncaughtexception')

    clearTimeout(this._updateServerStatusTimeout)
    clearTimeout(this._updateProcessesTimeout)

    delete this._updateServerStatusTimeout
    delete this._updateProcessesTimeout

    this.status = 'connecting'
  }.bind(this))

  this._remote.getDetails(function(error, details) {
    if (error) {
      this._logger.error('Error getting boss details', error)

      if(error.code == 'TIMEOUT') {
        this.status = 'timeout'
      } else if(error.code == 'INVALIDSIGNATURE') {
        this.status = 'badsignature'
      } else {
        this.status = 'error'
      }

      return
    }

    for (var key in details) {
      this[key] = details[key]
    }

    if (!details.version || !semver.satisfies(details.version, this._config.minVersion)) {
      this.status = 'incompatible'

      return
    }

    this.status = 'connected'

    // update details
    this._updateServerStatus()
    this._updateProcesses()

    this._remote.on('process:log:*', function(type, process, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.log(type.split(':')[2], event.date, event.message)
    }.bind(this))

    this._remote.on('process:uncaughtexception', function(process, event) {
      var proc = this.findProcessById(process.id)

      if (!proc) {
        return
      }

      proc.exception(event.date, event.message, event.code, event.stack)
    }.bind(this))

    this._remote.on('*', function() {
      var args = Array.prototype.slice.call(arguments)
      args.splice(1, 0, this.name)

      this._webSocketResponder.broadcast.apply(this._webSocketResponder, args)
    }.bind(this))

  }.bind(this))
}

HostData.prototype._updateServerStatus = function() {
  this._remote.getServerStatus(function(error, status) {
    if(error) {
      if(error.code == 'TIMEOUT') {
        if((Date.now() - this.lastUpdated) < this._timeoutThreshold) {
          // saw a different update in the last minute, ignore this timeout
          this._logger.info('Ignoring update server status timeout for %s as we saw an update %ss ago', this.name, (Date.now() - this.lastUpdated) / 1000)
        } else {
          this.status = 'timeout'
        }
      } else if(error.code == 'INVALIDSIGNATURE') {
        this.status = 'badsignature'
      } else {
        this.status = 'error'
      }

      this._logger.error('Error getting boss status from', this.name, error)
    } else {
      this.status = 'connected'

      for(var key in status) {
        this[key] = status[key]
      }

      this.lastUpdated = Date.now()

      this._webSocketResponder.broadcast('server:status', this.name, this)
    }

    if(this._updateServerStatusTimeout) {
      clearTimeout(this._updateServerStatusTimeout)
      delete this._updateServerStatusTimeout
    }

    this._updateServerStatusTimeout = setTimeout(this._updateServerStatus.bind(this), this._config.frequency)
  }.bind(this))
}

HostData.prototype._updateProcesses = function() {
  this._remote.listProcesses(function(error, processes) {
    if(error) {
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

      this._logger.error('Error listing processes on', this.name, error)
    } else {
      this.status = 'connected'

      this._removeMissingProcesses(processes)

      processes.forEach(function(data) {
        var existingProcess = this.findProcessById(data.id);

        if(!existingProcess) {
          this._processDataFactory.create([data], function(error, existingProcess) {
            this.processes.push(existingProcess)

            existingProcess.update(data)
          }.bind(this))
        } else {
          existingProcess.update(data)
        }
      }.bind(this))

      this.lastUpdated = Date.now()

      this._webSocketResponder.broadcast('server:processes', this.name, this.processes)
    }

    if(this._updateProcessesTimeout) {
      clearTimeout(this._updateProcessesTimeout)
      delete this._updateProcessesTimeout
    }

    this._updateProcessesTimeout = setTimeout(this._updateProcesses.bind(this), this._config.frequency)
  }.bind(this))
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
  if(!this._remote) {
    return callback(undefined, [])
  }

  this._remote.listApplications(callback)
}

HostData.prototype.findProcessById = function(id) {
  for(var i = 0; i < this.processes.length; i++) {
    var proc = this.processes[i]

    if(proc.id == id) {
      return proc
    }

    if(proc.workers) {
      for(var n = 0; n < proc.workers.length; i++) {
        if(proc.workers[n].id == id) {
          return proc.workers[n]
        }
      }
    }
  }

  return null
}

module.exports = HostData
