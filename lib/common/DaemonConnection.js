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
  this._processStore = Autowire
  this._appStore = Autowire

  this._api = {
    sendEvent: function () {
      var tasks = []

      var args = Array.prototype.slice.call(arguments, 0)
      var event = args[0]

      args.forEach(function (arg, index) {
        if (!arg || !arg.id) {
          return
        }

        var func

        if (arg.script) {
          func = this._findManagedProcess.bind(this)
        } else if (arg.url) {
          func = this._findManagedApp.bind(this)
        } else {
          return
        }

        tasks.push(function (index, args, callback) {
          func(arg, function (error, managed) {
            if (error) {
              return callback(error)
            }

            // replace info with object
            args[index] = managed

            if (event === 'worker:exit' && index === 2) {
              // remove the worker from the manager's array
              args[1].removeWorker(managed)

              // remove it from our store
              this._processStore.remove('id', managed.id)
            }

            // get processInfo to emit the event
            managed.emit.apply(managed, [event].concat(args.slice(index + 1)))

            callback()
          }.bind(this))
        }.bind(this, index, args))
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
    return callback(undefined, null)
  }

  this._processStore.findOrCreate('id', info.id, [info, this], function (error, managedProcess) {
    if (error) {
      return callback(error)
    }

    managedProcess.update(info)

    if (managedProcess.manager) {
      // this is a worker process, find the cluster manager and add it
      var manager = this._processStore.find('id', managedProcess.manager)
      managedProcess.manager = manager
      manager.addWorker(managedProcess)
    }

    callback(undefined, managedProcess)
  }.bind(this))
}

DaemonConnection.prototype._findManagedApp = function (info, callback) {
  if (!info) {
    return callback(undefined, null)
  }

  this._appStore.findOrCreate('id', info.id, [info, this], callback)
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

  this.listProcesses = this._overrideList.bind(this, listProcesses, this._processStore, this._findManagedProcess.bind(this))

  var startProcess = this.startProcess

  this.startProcess = function (script, options, callback) {
    if (typeof options === 'function' && !callback) {
      callback = options
      options = {}
    }

    startProcess(script, options, function (error, processInfo) {
      if (error) {
        callback(error)

        return
      }

      this._findManagedProcess(processInfo, callback)
    }.bind(this))
  }.bind(this)

  this._overrideFinderMethods(['findProcessInfoById', 'findProcessInfoByPid', 'findProcessInfoByName'], this._findManagedProcess.bind(this))
}

DaemonConnection.prototype._overrideAppMethods = function () {
  // hijack listProcesses to remove processInfos that have been removed
  var listApplications = this.listApplications

  this.listApplications = this._overrideList.bind(this, listApplications, this._appStore, this._findManagedApp.bind(this))

  var deployApplication = this.deployApplication

  this.deployApplication = function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = function () {}

    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
      args.push(function (error, appInfo) {
        if (error) {
          callback(error)

          return
        }

        this._findManagedApp(appInfo, callback)
      }.bind(this))
    }

    deployApplication.apply(this, args)
  }.bind(this)

  // replace pojo appInfo with EventEmitter version
  this._overrideFinderMethods(['findAppById', 'findAppByName'], this._findManagedApp.bind(this))
}

DaemonConnection.prototype._overrideList = function (list, store, find, callback) {
  list(function (error, things) {
    if (error) {
      callback(error)

      return
    }

    if (Array.isArray(things)) {
      // remove missing things
      store.intersect('id', things)
    }

    // replace pojo thingInfo with our managedThing
    async.parallel(things.map(function (thing, index) {
      return function (callback) {
        find(thing, function (error, managedThing) {
          if (error) {
            callback(error)

            return
          }

          things[index] = managedThing

          callback()
        })
      }
    }), function (error) {
      callback(error, things)
    })
  })
}

DaemonConnection.prototype._overrideFinderMethods = function (methods, find) {
  methods.forEach(function (method) {
    var original = this[method]

    this[method] = function (func, id, callback) {
      func(id, function (error, appInfo) {
        if (error) {
          callback(error)

          return
        }

        find(appInfo, callback)
      })
    }.bind(this, original)
  }.bind(this))
}

module.exports = DaemonConnection
