var Autowire = require('wantsit').Autowire
var EventEmitter = require('wildemitter')
var util = require('util')
var path = require('path')
var ProcessInfo = require('../domain/ProcessInfo')
var async = require('async')

var ProcessService = function () {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._logger = Autowire
  this._processInfoStore = Autowire
  this._config = Autowire
  this._managedProcessFactory = Autowire
  this._portService = Autowire
  this._child_process = Autowire

  // shut down all managed processes on exit
  process.on('exit', this.killAll.bind(this))
}
util.inherits(ProcessService, EventEmitter)

ProcessService.prototype.killAll = function () {
  this.listProcesses().forEach(function (process) {
    if (process.remote) {
      // may not have connected yet...
      process.remote.kill()
    } else if (process.process) {
      // may not have started yet...
      process.process.kill()
    }
  })
}

ProcessService.prototype.listProcesses = function () {
  return this._processInfoStore.all()
}

ProcessService.prototype.findById = function (id) {
  return this._processInfoStore.find('id', id)
}

ProcessService.prototype.findByPid = function (pid) {
  return this._processInfoStore.find('process.pid', pid)
}

ProcessService.prototype.findByName = function (name) {
  return this._processInfoStore.find('name', name)
}

ProcessService.prototype.startProcess = function (script, options, callback) {
  var processInfo

  if (arguments.length === 2 && script instanceof ProcessInfo && typeof options === 'function') {
    processInfo = script
    callback = options

    return this._startProcess(processInfo, callback)
  }

  processInfo = this._processInfoStore.find('name', options.name)
    || this._processInfoStore.find('name', script)
    || this._processInfoStore.find('script', script)

  if (processInfo) {
    if (processInfo.running) {
      return callback(new Error(processInfo.name + ' is already running'))
    }

    processInfo.setOptions(options)

    this._startProcess(processInfo, callback)

    return
  }

  options.script = options.script || script

  this._processInfoStore.create([options], function (error, processInfo) {
    if (error) {
      return callback(error)
    }

    this._startProcess(processInfo, callback)
  }.bind(this))
}

ProcessService.prototype._startProcess = function (processInfo, callback) {
  var type = processInfo.cluster ? 'cluster' : 'process'

  async.series([
    processInfo.validate.bind(processInfo),
    this._addDebugPort.bind(this, processInfo)
  ], function (error) {
    if (error) {
      processInfo.status = 'failed'
      this.emit(type + ':failed', processInfo, {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      return callback(error)
    }

    processInfo.status = 'starting'

    // tell everyone we are about to start a process/cluster
    this.emit(type + ':starting', processInfo)

    // fork it!
    processInfo.process = this._child_process.fork(path.resolve(__dirname, '../' + type), processInfo.getProcessArgs(), processInfo.getProcessOptions())

    // listen to appropriate messages
    this._setupProcessCallbacks(processInfo, type)

    // tell everyone we've just forked a process/cluster
    this.emit(type + ':forked', processInfo)

    callback(error, processInfo)
  }.bind(this))
}

ProcessService.prototype._addDebugPort = function (processInfo, callback) {
  this._portService.freePort(function (error, port) {
    if (error) return callback(error)

    processInfo.debugPort = port

    callback()
  })
}

ProcessService.prototype._setupProcessCallbacks = function (processInfo, prefix) {
  // process setup
  processInfo.process.on(prefix + ':config:request', this._handleConfigRequest.bind(this, processInfo))

  processInfo.process.on(prefix + ':stdin:write', function (string) {
    processInfo.process.stdin.write(string + '\n')
  })

  processInfo.process.on(prefix + ':signal', function (signal) {
    try {
      // invalid signal names cause errors to be thrown
      processInfo.process.kill(signal)
    } catch (e) {
      this._logger.debug('Error sending signal', signal, 'to process', e.stack)
    }
  }.bind(this))

  this._setUpLogging(processInfo, prefix)

  processInfo.process.on(prefix + ':started', this._handleProcessStarted.bind(this, processInfo, prefix))

  processInfo.process.on(prefix + ':stopping', function () {
    processInfo.status = 'stopping'
  })

  processInfo.process.on(prefix + ':failed', function (error) {
    this._logger.debug(prefix, processInfo.id, 'failed to initialise!', error.stack)

    processInfo.status = 'failed'
  }.bind(this))

  processInfo.process.on(prefix + ':errored', function (error) {
    this._logger.debug(prefix, processInfo.id, 'failed to start!', error.stack)

    processInfo.status = 'errored'
  }.bind(this))

  processInfo.process.on(prefix + ':restarting', function () {
    this._logger.debug('restarting', processInfo.id)

    processInfo.status = 'restarting'

    // restarting happens in response to user action so reset the restart counter
    // otherwise a user can cause a process to abort by restarting it more than
    // restartRetries during crashRecoveryPeriod
    processInfo.restarts = 0
  }.bind(this))

  processInfo.process.on(prefix + ':uncaughtexception', function (error) {
    this._logger.error('Child process %s %s (%d) experienced an uncaught exception', processInfo.id, processInfo.name, processInfo.process.pid, error.stack)

    processInfo.logger.error(error)
  }.bind(this))

  if (processInfo.cluster) {
    processInfo.process.on('cluster:workers', function (num) {
      processInfo.instances = num
    })
  }

  // Note that the exit event may or may not fire after an error has occurred.
  // http://nodejs.org/api/child_process.html#child_process_event_error
  processInfo.process.on('exit', this._handleProcessExit.bind(this, processInfo, prefix))
  processInfo.process.on('error', this._handleProcessError.bind(this, processInfo, prefix))

  this._forwardEvents(processInfo)
}

ProcessService.prototype._handleProcessStarted = function (processInfo, prefix, socket) {
  processInfo.status = 'started'
  processInfo.socket = socket

  this._managedProcessFactory.create([socket], function (error, proc) {
    if (error) {
      this._logger.error('Could not create remote process', error)

      processInfo.status = 'failed'

      return this.emit(prefix + ':failed', processInfo, {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })
    }

    proc.connect(function (error, remote) {
      if (error) {
        this._logger.error('Could not create connection to remote process', error)

        processInfo.status = 'failed'

        return this.emit(prefix + ':failed', processInfo, {
          date: Date.now(),
          message: error.message,
          code: error.code,
          stack: error.stack
        })
      }

      processInfo.remote = remote
      processInfo.status = 'running'

      // Wait a few seconds - if the process is still running then reset it's restart count
      setTimeout(function () {
        if (processInfo.status === 'running') {
          processInfo.restarts = 0
        }
      }, this._config.guvnor.restarttimeout)

      return this.emit(prefix + ':ready', processInfo)
    }.bind(this))
  }.bind(this))
}

ProcessService.prototype._setUpLogging = function (processInfo, prefix) {
  processInfo.process.on(prefix + ':log:info', function (log) {
    processInfo.logger.info(log.message)
  })
  processInfo.process.on(prefix + ':log:warn', function (log) {
    processInfo.logger.warn(log.message)
  })
  processInfo.process.on(prefix + ':log:error', function (log) {
    processInfo.logger.error(log.message)
  })
  processInfo.process.on(prefix + ':log:debug', function (log) {
    processInfo.logger.debug(log.message)
  })
}

ProcessService.prototype._exitWasUnclean = function (code) {
  return code === null || code !== 0
}

ProcessService.prototype._handleConfigRequest = function (processInfo) {
  processInfo.process.send({
    event: 'daemon:config:response',
    args: [this._config]
  })
}

ProcessService.prototype._handleProcessExit = function (processInfo, prefix, code, signal) {
  if (signal) {
    this._logger.debug('Child process %s (%s) exited with code %d and signal %s', processInfo.name, processInfo.process.pid, code, signal)
  } else {
    this._logger.debug('Child process %s (%s) exited with code %d', processInfo.name, processInfo.process.pid, code)
  }

  // common codes
  if (code === 8) {
    this._logger.debug('Uncaught exception?')
  }

  delete processInfo.socket
  delete processInfo.remote

  var previousStatus = processInfo.status

  if (this._exitWasUnclean(code) || processInfo.status === 'restarting') {
    this._restartProcess(processInfo, prefix)
  } else {
    processInfo.process = undefined
    processInfo.status = 'stopped'
  }

  if (previousStatus !== 'errored') {
    this.emit(prefix + ':exit', processInfo, undefined, code, signal)
  }
}

ProcessService.prototype._handleProcessError = function (processInfo, prefix, error) {
  this._logger.error('Child process', processInfo.name, 'emitted error event', error)

  delete processInfo.socket
  delete processInfo.remote

  var previousStatus = processInfo.status

  processInfo.status = 'errored'

  if (previousStatus !== 'stopped') {
    this.emit(prefix + ':exit', processInfo, error)
  }

  this._restartProcess(processInfo, prefix)
}

/**
 * Restart a failed process, provided it is configured to be restarted, and hasn't errd too many times.
 */
ProcessService.prototype._restartProcess = function (processInfo, prefix) {
  var failedPid = processInfo.process.pid

  if (!processInfo.restartOnError) {
    return
  }

  processInfo.restarts++
  processInfo.totalRestarts++

  if (processInfo.restarts < processInfo.restartRetries) {
    this._logger.debug('Restarting process %s %d x %d', processInfo.name, failedPid, processInfo.restarts)

    this._startProcess(processInfo, function (error, processInfo) {
      if (error) {
        return this._logger.error('Failed to restart process', processInfo.name, failedPid, error)
      }

      this.emit(prefix + ':restarted', processInfo, failedPid)

      this._logger.debug('Restarted process', processInfo.name, failedPid, 'as', processInfo.process.pid)
    }.bind(this))
  } else {
    processInfo.status = 'aborted'
    delete processInfo.pid

    this.emit(prefix + ':aborted', processInfo)
  }
}

ProcessService.prototype._forwardEvents = function (processInfo) {
  var proc = processInfo.process
  var oldEmit = proc.emit

  proc.emit = function () {
    oldEmit.apply(proc, arguments)

    var event = arguments[0]

    // only forward namespaced events
    if (event && event.indexOf(':') !== -1) {
      var args = Array.prototype.slice.call(arguments)
      args.splice(1, 0, processInfo)

      this.emit.apply(this, args)
    }
  }.bind(this)
}

ProcessService.prototype.removeProcess = function (id, callback) {
  var processInfo = this.findById(id)

  if (!processInfo) {
    return callback()
  }

  if (processInfo.running) {
    return callback(new Error('Process ' + process.name + ' is still running'))
  }

  this._processInfoStore.remove('id', id)

  callback()
}

module.exports = ProcessService
