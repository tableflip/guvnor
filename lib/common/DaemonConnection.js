var EventEmitter = require('wildemitter')
var util = require('util')
var Autowire = require('wantsit').Autowire
var async = require('async')

var DaemonConnection = function () {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._logger = Autowire
  this._managedProcessFactory = Autowire
  this._semver = Autowire

  this._processes = {}

  this._api = {
    sendEvent: function () {
      var tasks = []

      var args = Array.prototype.slice.call(arguments, 0)
      var event = args[0]

      args.forEach(function(arg, index) {
        if(arg && arg.id) {
          tasks.push(function (args, callback) {
            this._findManagedProcess(arg, function (error, managedProcess) {
              if (error) return callback(error)

              // replace processInfo with object
              args[index] = managedProcess

              if (event === 'worker:exit' && index === 2) {
                // remove the worker from the manager's array
                args[1].removeWorker(managedProcess)

                // remove it from our store
                delete this._processes[managedProcess.id]
              }

              // get processInfo to emit the event
              managedProcess.emit.apply(managedProcess, [event].concat(args.slice(index + 1)))

              callback()
            }.bind(this))
          }.bind(this, args))
        }
      }.bind(this))

      async.series(tasks, function () {
        // broadcast event to all listeners
        this.emit.apply(this, args)
      }.bind(this, args))
    }.bind(this)
  }
}
util.inherits(DaemonConnection, EventEmitter)

DaemonConnection.prototype._findManagedProcess = function (info, callback) {
  if (!info) {
    return callback()
  }

  var tasks = []

  if (!this._processes[info.id]) {
    tasks.push(this._createManagedProcess.bind(this, info))
  }

  async.series(tasks, function (error) {
    if (error) {
      return callback(error)
    }

    var managedProcess = this._processes[info.id]
    managedProcess.update(info)

    if (managedProcess.manager) {
      // this is a worker process, find the cluster manager and add it
      var manager = this._processes[managedProcess.manager]
      managedProcess.manager = manager
      manager.addWorker(managedProcess)
    }

    callback(undefined, managedProcess)
  }.bind(this))
}

DaemonConnection.prototype._createManagedProcess = function (info, callback) {
  this._managedProcessFactory.create([info.socket], function (error, managedProcess) {
    if (!error) {
      this._processes[info.id] = managedProcess
    }

    callback(error, managedProcess)
  }.bind(this))
}

DaemonConnection.prototype._removeMissingProcesses = function (processes) {
  for (var id in this._processes) {
    if (!processes.some(function (proc) {
        return proc.id === id
      })) {
      delete this._processes[id]
    }
  }
}

DaemonConnection.prototype.connect = function (callback) {
  if (!this._semver.satisfies(process.versions.node, '>=0.10.29')) {
    return callback(new Error('Please use node 0.10.29 or later'))
  }

  this._connect(callback)
}

DaemonConnection.prototype._connect = function (callback) {}

DaemonConnection.prototype.disconnect = function (callback) {}

DaemonConnection.prototype.connectToProcess = function (id, callback) {
  this._logger.warn('Deprecation warning: connectToProcess will be removed in a future release, please use methods on process objects instead')

  this._connectToProcess(id, callback)
}

DaemonConnection.prototype._connectToProcess = function (id, callback) {}

DaemonConnection.prototype._overrideProcessInfoMethods = function () {
  // hijack listProcesses to remove processInfos that have been removed
  var listProcesses = this.listProcesses

  this.listProcesses = function (callback) {
    listProcesses(function (error, processes) {
      if (error) {
        return callback(error)
      }

      if (Array.isArray(processes)) {
        this._removeMissingProcesses(processes)
      }

      // replace pojo processInfo with our managedProcesses
      async.parallel(processes.map(function (process, index) {
        return function (callback) {
          this._findManagedProcess(process, function (error, managedProcess) {
            if (error) return callback(error)

            processes[index] = managedProcess

            callback()
          })
        }.bind(this)
      }.bind(this)), function (error) {
          callback(error, processes)
        })
    }.bind(this))
  }.bind(this)

  var startProcess = this.startProcess

  this.startProcess = function (script, options, callback) {
    startProcess(script, options, function (error, processInfo) {
      if (error) return callback(error)

      this._findManagedProcess(processInfo, callback)
    }.bind(this))
  }.bind(this)

  // replace pojo processInfo with EventEmitter version
  var processInfoFinders = ['findProcessInfoById', 'findProcessInfoByPid', 'findProcessInfoByName']

  processInfoFinders.forEach(function (method) {
    var original = this[method]

    this[method] = function (func, id, callback) {
      func(id, function (error, processInfo) {
        if (error) return callback(error)

        this._findManagedProcess(processInfo, callback)
      }.bind(this))
    }.bind(this, original)
  }.bind(this))
}

module.exports = DaemonConnection
