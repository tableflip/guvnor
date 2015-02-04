var Autowire = require('wantsit').Autowire,
  EventEmitter = require('wildemitter'),
  util = require('util'),
  path = require('path'),
  ProcessInfo = require('../domain/ProcessInfo'),
  async = require('async')

var ProcessService = function() {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._logger = Autowire
  this._processInfoStore = Autowire
  this._config = Autowire
  this._processFactory = Autowire
  this._freeport = Autowire
  this._child_process = Autowire

  // shut down all managed processes on exit
  process.on('exit', this.killAll.bind(this))
}
util.inherits(ProcessService, EventEmitter)

ProcessService.prototype.killAll = function() {
  this.listProcesses().forEach(function(process) {
    if(process.remote) {
      // may not have connected yet...
      process.remote.kill()
    } else if(process.process) {
      // may not have started yet...
      process.process.kill()
    }
  })
}

ProcessService.prototype.listProcesses = function() {
  return this._processInfoStore.all()
}

ProcessService.prototype.findById = function(id) {
  return this._processInfoStore.find('id', id)
}

ProcessService.prototype.findByPid = function(pid) {
  return this._processInfoStore.find('process.pid', pid)
}

ProcessService.prototype.findByName = function(name) {
  return this._processInfoStore.find('name', name)
}

ProcessService.prototype.startProcess = function(script, options, callback) {
  var processInfo

  if(arguments.length == 2 && script instanceof ProcessInfo && typeof options == 'function') {
    processInfo = script
    callback = options

    return this._startProcess(processInfo, callback)
  }

  processInfo = this._processInfoStore.find('name', options.name) || this._processInfoStore.find('name', script)

  if(processInfo) {
    if(processInfo.running) {
      return callback(new Error(processInfo.name + ' is already running'))
    }

    processInfo.setOptions(options)

    this._startProcess(processInfo, callback)

    return
  }

  options.script = options.script || script

  this._processInfoStore.create([options], function(error, processInfo) {
    if(error) {
      return callback(error)
    }

    this._startProcess(processInfo, callback)
  }.bind(this))
}

ProcessService.prototype._startProcess = function(processInfo, callback) {
  async.series([
    processInfo.validate.bind(processInfo),
    this._addDebugPort.bind(this, processInfo)
  ], function(error) {
    if(error) {
      processInfo.status = 'failed'
      this.emit('process:failed', processInfo, {
        date: Date.now(),
        message: error.message,
        code: error.code,
        stack: error.stack
      })

      return callback(error)
    }

    processInfo.status = 'starting'

    if(processInfo.cluster) {
      this.emit('cluster:starting', processInfo)
      processInfo.process = this._child_process.fork(path.resolve(__dirname, '../cluster'), processInfo.getProcessArgs(), processInfo.getProcessOptions())
    } else {
      this.emit('process:starting', processInfo)
      processInfo.process = this._child_process.fork(path.resolve(__dirname, '../process'), processInfo.getProcessArgs(), processInfo.getProcessOptions())
    }

    this._setupProcessCallbacks(processInfo, 'process')

    if(processInfo.cluster) {
      this.emit('cluster:forked', processInfo)
    } else {
      this.emit('process:forked', processInfo)
    }

    callback(error, processInfo)
  }.bind(this))
}

ProcessService.prototype._addDebugPort = function(processInfo, callback) {
  this._freeport(function(error, port) {
    if(error) return callback(error)

    processInfo.debugPort = port

    callback()
  }.bind(this))
}

ProcessService.prototype._forwardEvent = function(processInfo, event, args) {
  args = Array.prototype.slice.call(args)
  args.unshift(processInfo)
  args.unshift(event)

  this.emit.apply(this, args)
}

ProcessService.prototype._setupProcessCallbacks = function(processInfo, prefix) {
  // process setup
  processInfo.process.on(prefix + ':config:request', function() {
    processInfo.process.send({type: 'boss:config:response', args: [this._config]})
  }.bind(this))

  // logging
  processInfo.process.on(prefix + ':log:info', function(log) {
    processInfo.logger.info(log.message)
    this._forwardEvent(processInfo, prefix + ':log:info', Array.prototype.slice.call(arguments))
  }.bind(this))
  processInfo.process.on(prefix + ':log:warn', function(log) {
    processInfo.logger.warn(log.message)
    this._forwardEvent(processInfo, prefix + ':log:warn', Array.prototype.slice.call(arguments))
  }.bind(this))
  processInfo.process.on(prefix + ':log:error', function(log) {
    processInfo.logger.error(log.message)
    this._forwardEvent(processInfo, prefix + ':log:error', Array.prototype.slice.call(arguments))
  }.bind(this))
  processInfo.process.on(prefix + ':log:debug', function(log) {
    processInfo.logger.debug(log.message)
    this._forwardEvent(processInfo, prefix + ':log:debug', Array.prototype.slice.call(arguments))
  }.bind(this))

  processInfo.process.on(prefix + ':started', function(socket) {
    processInfo.status = 'started'
    processInfo.socket = socket

    this._forwardEvent(processInfo, prefix + ':started', Array.prototype.slice.call(arguments))

    this._processFactory.create([socket], function(error, proc) {
      proc.connect(function(error, remote) {
        if(error) {
          this._logger.error('Could not create connection to remote process', error)

          processInfo.status = 'failed'

          if(processInfo.cluster) {
            return this.emit('cluster:failed', processInfo, {
              date: Date.now(),
              message: error.message,
              code: error.code,
              stack: error.stack
            })
          } else {
            return this.emit(prefix + ':failed', processInfo, {
              date: Date.now(),
              message: error.message,
              code: error.code,
              stack: error.stack
            })
          }
        }

        processInfo.remote = remote
        processInfo.status = 'running'

        if(processInfo.cluster) {
          return this.emit('cluster:started', processInfo)
        } else {
          processInfo.restarts = 0

          return this.emit(prefix + ':ready', processInfo)
        }
      }.bind(this))
    }.bind(this))
  }.bind(this))

  processInfo.process.on(prefix + ':stopping', function() {
    processInfo.status = 'stopping'

    this._forwardEvent(processInfo, prefix + ':stopping', Array.prototype.slice.call(arguments))
  }.bind(this))

  processInfo.process.on(prefix + ':failed', function(error) {
    this._logger.debug(prefix, processInfo.id, 'failed to initialise!', error.stack)

    processInfo.status = 'failed'

    this._forwardEvent(processInfo, prefix + ':failed', Array.prototype.slice.call(arguments))
  }.bind(this))

  processInfo.process.on(prefix + ':errored', function(error) {
    this._logger.debug(prefix, processInfo.id, 'failed to start!', error.stack)

    processInfo.status = 'errored'

    this._forwardEvent(processInfo, prefix + ':errored', Array.prototype.slice.call(arguments))
  }.bind(this))

  processInfo.process.on(prefix + ':restarting', function() {
    this._logger.debug('restarting', processInfo.id)

    processInfo.status = 'restarting'

    // restarting happens in response to user action so reset the restart counter
    // otherwise a user can cause a process to abort by restarting it more than
    // restartRetries during crashRecoveryPeriod
    processInfo.restarts = 0

    this._forwardEvent(processInfo, prefix + ':restarting', Array.prototype.slice.call(arguments))
  }.bind(this))

  processInfo.process.on(prefix + ':uncaughtexception', function(error) {
    this._logger.error('Child process %s %s (%d) experienced an uncaught exception', processInfo.id, processInfo.name, processInfo.process.pid, error.stack)

    processInfo.logger.error(error)

    this._forwardEvent(processInfo, prefix + ':uncaughtexception', Array.prototype.slice.call(arguments))
  }.bind(this))

  // forward on events that need no special processing
  var events = [
      prefix + ':forked', prefix + ':starting', prefix + ':ready',
      prefix + ':heapdump:start', prefix + ':heapdump:error', prefix + ':heapdump:complete',
      prefix + ':gc:start', prefix + ':gc:error', prefix + ':gc:complete'
  ]

  events.forEach(function(event) {
    processInfo.process.on(event, function() {
      this._forwardEvent(processInfo, event, Array.prototype.slice.call(arguments))
    }.bind(this))
  }.bind(this))

  if(processInfo.cluster) {
    processInfo.process.on('cluster:failed', function(error) {
      this._logger.debug('Cluster manager %s %s (%d) failed to start - %s', processInfo.id, processInfo.name, processInfo.process.pid, error.stack)

      this._forwardEvent(processInfo, 'cluster:failed', Array.prototype.slice.call(arguments))
    }.bind(this))

    processInfo.process.on('cluster:online', function() {
      this._forwardEvent(processInfo, 'cluster:online', Array.prototype.slice.call(arguments))
    }.bind(this))

    processInfo.process.on('cluster:started', function(socket) {
      this._logger.debug('Cluster manager %s %s (%d) ready', processInfo.id, processInfo.name, processInfo.process.pid)

      processInfo.status = 'started'
      processInfo.socket = socket

      this._forwardEvent(processInfo, 'cluster:started', Array.prototype.slice.call(arguments))

      this._processFactory.create([socket], function(error, proc) {
        if(error) {
          this._logger.error('Could not create cluster process info')

          processInfo.status = 'failed'

          return this.emit('cluster:failed', processInfo)
        }

        proc.connect(function(error, remote) {
          if(error) {
            this._logger.error('Could not create connection to remote process')

            processInfo.status = 'failed'

            return this.emit('cluster:failed', processInfo)
          }

          processInfo.remote = remote
          processInfo.status = 'running'

          this.emit('cluster:ready', processInfo)
        }.bind(this))
      }.bind(this))
    }.bind(this))

    processInfo.process.on('cluster:workers', function(num) {
      processInfo.instances = num
    }.bind(this))

    // forward on worker events
    var workerEvents = [
      'worker:forked', 'worker:starting', 'worker:started',  'worker:ready',
      'worker:stopping', 'worker:exit', 'worker:failed',  'worker:restarting',
      'worker:aborted', 'worker:uncaughtexception',
      'worker:heapdump:start', 'worker:heapdump:error',
      'worker:heapdump:complete', 'worker:gc:start',
      'worker:gc:error', 'worker:gc:complete'
    ]

    workerEvents.forEach(function(event) {
        processInfo.process.on(event, function() {
          this._forwardEvent(processInfo, event, Array.prototype.slice.call(arguments))
        }.bind(this))
      }.bind(this))
  }

  // Note that the exit event may or may not fire after an error has occurred.
  // http://nodejs.org/api/child_process.html#child_process_event_error

  processInfo.process.on('exit', function(code, signal) {
    if(signal) {
      this._logger.debug('Child process %s (%s) exited with code %d and signal %s', processInfo.name, processInfo.process.pid, code, signal)
    } else {
      this._logger.debug('Child process %s (%s) exited with code %d', processInfo.name, processInfo.process.pid, code)
    }

    // common codes
    if(code == 8) {
      this._logger.debug('Uncaught exception?')
    }

    delete processInfo.socket
    delete processInfo.remote

    var previousStatus = processInfo.status

    if(this._exitWasUnclean(code) || processInfo.status == 'restarting') {
      this._restartProcess(processInfo, prefix)
    } else {
      processInfo.process = undefined
      processInfo.status = 'stopped'
    }

    if(previousStatus != 'errored') {
      this.emit(prefix + ':exit', processInfo, undefined, code, signal)
    }
  }.bind(this))

  processInfo.process.on('error', function(error) {
    this._logger.error('Child process', processInfo.name, 'emitted error event', error)

    delete processInfo.socket
    delete processInfo.remote

    var previousStatus = processInfo.status

    processInfo.status = 'errored'

    if(previousStatus != 'stopped') {
      this.emit(prefix + ':exit', processInfo, error)
    }

    this._restartProcess(processInfo, prefix)
  }.bind(this))
}

ProcessService.prototype._exitWasUnclean = function(code) {
  return code === null || code !== 0
}

/**
 * Restart a failed process, provided it is configured to be restarted, and hasn't errd too many times.
 */
ProcessService.prototype._restartProcess = function(processInfo, prefix) {
  var failedPid = processInfo.process.pid

  if(!processInfo.restartOnError) {
    //this._processInfoStore.remove('id', processInfo.id)

    return
  }

  processInfo.restarts++
  processInfo.totalRestarts++

  if(processInfo.restarts < processInfo.restartRetries) {
    this._logger.debug('Restarting process %s %d x %d', processInfo.name, failedPid, processInfo.restarts)

    this._startProcess(processInfo, function(error, processInfo) {
      if(error) {
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

ProcessService.prototype.removeProcess = function(id, callback) {
  var processInfo = this.findById(id)

  if(!processInfo) {
    return callback()
  }

  if(processInfo.running) {
    return callback(new Error('Process ' + process.name + ' is still running'))
  }

  this._processInfoStore.remove('id', id)

  callback()
}

module.exports = ProcessService
