var EventEmitter = require('wildemitter'),
  util = require('util'),
  Autowire = require('wantsit').Autowire,
  async = require('async'),
  LocalProcess = require('./LocalProcess')

var LocalDaemon = function() {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._semver = Autowire
  this._logger = Autowire
  this._processFactory = Autowire
  this._localDaemonStarter = Autowire
  this._localDaemonAdminConnection = Autowire
  this._localDaemonUserConnection = Autowire

  this._processes = {}

  this._api = {
    sendEvent: function() {
      var args = Array.prototype.slice.call(arguments, 0)
      var event = args[0]

      if(event.substring(0, 8) == 'process:' || event.substring(0, 8) == 'cluster:') {
        // replace processInfo with object
        var proc = args[1] = this._findLocalProcess(args[1])

        // get processInfo to emit the event
        proc.emit.apply(proc, [event].concat(args.slice(2)))
      } else if(event.substring(0, 7) == 'worker:') {
        // worker events have cluster info and worker info
        var cluster = args[1] = this._findLocalProcess(args[1])
        var worker = args[2] = this._findLocalProcess(args[2])

        // get worker and cluster to emit the event
        cluster.emit.apply(worker, [event].concat(args.slice(3)))
        worker.emit.apply(worker, [event].concat(args.slice(3)))
      }

      // broadcast event to all listeners
      this.emit.apply(this, args)
    }.bind(this)
  }
}
util.inherits(LocalDaemon, EventEmitter)

LocalDaemon.prototype._findLocalProcess = function(info) {
  if(!info) {
    return undefined
  }

  if(!this._processes[info.id]) {
    this._processes[info.id] = new LocalProcess(this)
  }

  var proc = this._processes[info.id]
  proc.update(info)

  return proc
}

LocalDaemon.prototype._removeMissingProcesses = function(processes) {
  for(var id in this._processes) {
    if(!processes.some(function(proc) {
        return proc.id == id
      })) {
      delete this._processes[id]
    }
  }
}

LocalDaemon.prototype.connect = function(callback) {
  if(!this._semver.satisfies(process.versions.node, '>=0.10.29')) {
    return callback(new Error('Please use node 0.10.29 or later'))
  }

  if(this._localDaemonUserConnection.connected) {
    this._logger.debug('Already connected to daemon, executing callback')
    process.nextTick(callback.bind(callback, undefined, this))

    return
  }

  // try to connect to daemon
  this._localDaemonUserConnection.connect(this._api, function(error, serverApi) {
    if(error) return callback(error)

    // expose server user methods
    for(var key in serverApi) {
      this[key] = serverApi[key]
    }

    // reset process list
    this._processes = {}

    // hijack listProcesses to remove processInfos that have been removed
    var listProcesses = this.listProcesses

    this.listProcesses = function(callback) {
      listProcesses(function(error, processes) {
        if(Array.isArray(processes)) {
          this._removeMissingProcesses(processes)
        }

        // replace pojo processInfo with our EventEmitters
        callback(error, processes.map(this._findLocalProcess.bind(this)))
      }.bind(this))
    }.bind(this)

    var startProcess = this.startProcess

    this.startProcess = function(script, options, callback) {
      startProcess(script, options, function(error, processInfo) {
        callback(error, this._findLocalProcess(processInfo))
      }.bind(this))
    }.bind(this)

    // replace pojo processInfo with EventEmitter version
    var processInfoFinders = ['findProcessInfoById', 'findProcessInfoByPid', 'findProcessInfoByName']

    processInfoFinders.forEach(function(method) {
      var original = this[method]

      this[method] = function(func, id, callback) {
        func(id, function(error, processInfo) {
          callback(error, this._findLocalProcess(processInfo))
        }.bind(this))
      }.bind(this, original)
    }.bind(this))


    this._localDaemonAdminConnection.connect(this._api, function(error, serverApi) {
      if(error) {
        if(error.code == 'EACCES') {
          // this user cannot connect to the admin socket
          this._logger.debug('Access to admin socket denied')
          return callback(undefined, this)
        } else {
          return callback(error)
        }
      }

      // expose server admin methods
      for(var key in serverApi) {
        this[key] = serverApi[key]
      }

      return callback(undefined, this)
    }.bind(this))
  }.bind(this))
}

LocalDaemon.prototype.connectOrStart = function(callback) {
  this.connect(function(error, daemon) {
    if(error && error.code == 'DAEMON_NOT_RUNNING') {
      this._logger.debug('Daemon was not running so will start it')

      this._localDaemonStarter.start(function(error) {
        if(error) {
          return callback(error)
        }

        this._logger.debug('Daemon started')

        this.connect(callback)
      }.bind(this))

      return
    }

    return callback(error, daemon)
  }.bind(this))
}

LocalDaemon.prototype.disconnect = function(callback) {
  async.parallel([
    this._localDaemonStarter.disconnect.bind(this._localDaemonStarter),
    this._localDaemonUserConnection.disconnect.bind(this._localDaemonUserConnection),
    this._localDaemonAdminConnection.disconnect.bind(this._localDaemonAdminConnection)
  ], function(error) {
    if(callback) {
      callback(error)
    }
  })
}

LocalDaemon.prototype.connectToProcess = function(id, callback) {
  if(!this._localDaemonUserConnection.connected) {
    return callback(new Error('Not connected to remote daemon'))
  }

  this.findProcessInfoById(id, function(error, processInfo) {
    if(error) return callback(error)
    if(!processInfo) return callback()

    if(!processInfo.socket) {
      return callback(new Error('Process ' + processInfo.name + ' is not ready yet'))
    }

    this._processFactory.create([processInfo.socket], function(error, proc) {
      if(error) return callback(error)

      proc.connect(callback)
    })
  }.bind(this))
}

module.exports = LocalDaemon
