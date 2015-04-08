var Autowire = require('wantsit').Autowire
var EventEmitter = require('wildemitter')
var util = require('util')
var path = require('path')
var ProcessInfo = require('../domain/ProcessInfo')
var async = require('async')

// https://github.com/joyent/node/blob/master/doc/api/process.markdown#exit-codes
var EXIT_CODES = []
EXIT_CODES[1] = {
  summary: 'Uncaught Fatal Exception',
  detail: 'There was an uncaught exception, and it was not handled by a domain or an `uncaughtException` event handler.'
}
EXIT_CODES[2] = {
  summary: 'Unused',
  detail: 'Reserved by Bash for builtin misuse'
}
EXIT_CODES[3] = {
  summary: 'Internal JavaScript Parse Error',
  detail: 'The JavaScript source code internal in Node\'s bootstrapping process caused a parse error. This is extremely rare, and generally can only happen during development of Node itself.'
}
EXIT_CODES[4] = {
  summary: 'Internal JavaScript Evaluation Failure',
  detail: 'The JavaScript source code internal in Node\'s bootstrapping process failed to return a function value when evaluated. This is extremely rare, and generally can only happen during development of Node itself.'
}
EXIT_CODES[5] = {
  summary: 'Fatal Error',
  detail: 'There was a fatal unrecoverable error in V8. Typically a message will be printed to stderr with the prefix FATAL ERROR.'
}
EXIT_CODES[6] = {
  summary: 'Non-function Internal Exception Handler',
  detail: 'There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.'
}
EXIT_CODES[7] = {
  summary: 'Internal Exception Handler Run-Time Failure',
  detail: 'There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it. This can happen, for example, if a process.on(\'uncaughtException\') or domain.on(\'error\') handler throws an error.'
}
EXIT_CODES[8] = {
  summary: 'Unused',
  detail: 'In previous versions of Node, exit code 8 sometimes indicated an uncaught exception.'
}
EXIT_CODES[9] = {
  summary: 'Invalid Argument',
  detail: 'Either an unknown option was specified, or an option requiring a value was provided without a value.'
}
EXIT_CODES[10] = {
  summary: 'Internal JavaScript Run-Time Failure',
  detail: 'The JavaScript source code internal in Node\'s bootstrapping process threw an error when the bootstrapping function was called. This is extremely rare, and generally can only happen during development of Node itself.'
}
EXIT_CODES[12] = {
  summary: 'Invalid Debug Argument',
  detail: 'The --debug and/or --debug-brk options were set, but an invalid port number was chosen.'
}

// http://people.cs.pitt.edu/~alanjawi/cs449/code/shell/UnixSignals.htm
EXIT_CODES[128 + 1] = {
  summary: 'SIGHUP',
  detail: 'Hangup'
}
EXIT_CODES[128 + 2] = {
  summary: 'SIGINT',
  detail: 'Interrupt'
}
EXIT_CODES[128 + 3] = {
  summary: 'SIGQUIT',
  detail: 'Quit'
}
EXIT_CODES[128 + 4] = {
  summary: 'SIGILL',
  detail: 'Illegal Instruction'
}
EXIT_CODES[128 + 5] = {
  summary: 'SIGTRAP',
  detail: 'Trace/Breakpoint Trap'
}
EXIT_CODES[128 + 6] = {
  summary: 'SIGABRT',
  detail: 'Abort'
}
EXIT_CODES[128 + 7] = {
  summary: 'SIGEMT',
  detail: 'Emulation Trap'
}
EXIT_CODES[128 + 8] = {
  summary: 'SIGFPE',
  detail: 'Arithmetic Exception'
}
EXIT_CODES[128 + 9] = {
  summary: 'SIGKILL',
  detail: 'Killed'
}
EXIT_CODES[128 + 10] = {
  summary: 'SIGBUS',
  detail: 'Bus Error'
}
EXIT_CODES[128 + 11] = {
  summary: 'SIGSEGV',
  detail: 'Segmentation Fault'
}
EXIT_CODES[128 + 12] = {
  summary: 'SIGSEGV',
  detail: 'Bad System Call'
}
EXIT_CODES[128 + 13] = {
  summary: 'SIGPIPE',
  detail: 'Broken Pipe'
}
EXIT_CODES[128 + 14] = {
  summary: 'SIGALRM',
  detail: 'Alarm Clock'
}
EXIT_CODES[128 + 15] = {
  summary: 'SIGTERM',
  detail: 'Terminated'
}
EXIT_CODES[128 + 16] = {
  summary: 'SIGUSR1',
  detail: 'User Signal 1'
}
EXIT_CODES[128 + 17] = {
  summary: 'SIGUSR2',
  detail: 'User Signal 2'
}
EXIT_CODES[128 + 18] = {
  summary: 'SIGCHLD',
  detail: 'Child Status'
}
EXIT_CODES[128 + 19] = {
  summary: 'SIGPWR',
  detail: 'Power Fail/Restart'
}
EXIT_CODES[128 + 20] = {
  summary: 'SIGWINCH',
  detail: 'Window Size Change'
}
EXIT_CODES[128 + 21] = {
  summary: 'SIGURG',
  detail: 'Urgent Socket Condition'
}
EXIT_CODES[128 + 22] = {
  summary: 'SIGURG',
  detail: 'Socket I/O Possible'
}
EXIT_CODES[128 + 23] = {
  summary: 'SIGSTOP',
  detail: 'Stopped (signal)'
}
EXIT_CODES[128 + 24] = {
  summary: 'SIGTSTP',
  detail: 'Stopped (user)'
}
EXIT_CODES[128 + 25] = {
  summary: 'SIGCONT',
  detail: 'Continued'
}
EXIT_CODES[128 + 26] = {
  summary: 'SIGTTIN',
  detail: 'Stopped (tty input)'
}
EXIT_CODES[128 + 27] = {
  summary: 'SIGTTOU',
  detail: 'Stopped (tty output)'
}
EXIT_CODES[128 + 28] = {
  summary: 'SIGVTALRM',
  detail: 'Virtual Timer Expired'
}
EXIT_CODES[128 + 29] = {
  summary: 'SIGPROF',
  detail: 'Profiling Timer Expired'
}
EXIT_CODES[128 + 30] = {
  summary: 'SIGXCPU',
  detail: 'CPU time limit exceeded'
}
EXIT_CODES[128 + 31] = {
  summary: 'SIGXFSZ',
  detail: 'File size limit exceeded'
}
EXIT_CODES[128 + 32] = {
  summary: 'SIGWAITING',
  detail: 'All LWPs blocked'
}
EXIT_CODES[128 + 33] = {
  summary: 'SIGLWP',
  detail: 'irtual Interprocessor Interrupt for Threads Library'
}
EXIT_CODES[128 + 34] = {
  summary: 'SIGAIO',
  detail: 'Asynchronous I/O'
}

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
    this._logger.error('Child process %s %s experienced an uncaught exception %s', processInfo.id, processInfo.name, error.stack)

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

ProcessService.prototype._handleConfigRequest = function (processInfo) {
  processInfo.process.send({
    event: 'daemon:config:response',
    args: [this._config]
  })
}

ProcessService.prototype._handleProcessExit = function (processInfo, prefix, code, signal) {
  if (signal) {
    this._logger.debug('Child process %s exited with code %s and signal %s', processInfo.name, code, signal)
    processInfo.logger.error('Child process %s exited with code %s and signal %s', processInfo.name, code, signal)
  } else {
    this._logger.debug('Child process %s exited with code %s', processInfo.name, code)
    processInfo.logger.error('Child process %s exited with code %s', processInfo.name, code)
  }

  if (EXIT_CODES[code]) {
    this._logger.debug(EXIT_CODES[code].summary)
    this._logger.debug(EXIT_CODES[code].detail)

    processInfo.logger.error(EXIT_CODES[code].summary)
    processInfo.logger.error(EXIT_CODES[code].detail)
  }

  var previousStatus = processInfo.status

  // n.b. sometimes when a process is killed by a signal the code is null - !== will
  // cause the process to restart in this case
  if (code !== 0 || processInfo.status === 'restarting') {
    this._restartProcess(processInfo, prefix)
  } else {
    processInfo.status = 'stopped'
    processInfo.socket = null
    processInfo.remote = null
    processInfo.process = null
  }

  // if the previous status was 'errored' _handleProcessError was invoked
  if (previousStatus !== 'errored') {
    this.emit(prefix + ':exit', processInfo, undefined, code, signal)
  }
}

ProcessService.prototype._handleProcessError = function (processInfo, prefix, error) {
  this._logger.warn('Child process %s emitted error event %s', processInfo.name, error.stack ? error.stack : error.message ? error.message : error)
  processInfo.logger.error(error.stack ? error.stack : error.message ? error.message : error)

  var previousStatus = processInfo.status

  processInfo.status = 'errored'

  // if the previous status was 'stopped' _handleProcessExit was invoked
  if (previousStatus !== 'stopped') {
    this.emit(prefix + ':exit', processInfo, error)
  }

  this._restartProcess(processInfo, prefix)
}

/**
 * Restart a failed process, provided it is configured to be restarted, and hasn't errd too many times.
 */
ProcessService.prototype._restartProcess = function (processInfo, prefix) {
  processInfo.socket = null
  processInfo.remote = null
  processInfo.process = null

  if (!processInfo.restartOnError) {
    return
  }

  processInfo.restarts++
  processInfo.totalRestarts++

  if (processInfo.restarts < processInfo.restartRetries) {
    this._logger.debug('Restarting process %s %d x %d', processInfo.name, processInfo.restarts)

    this._startProcess(processInfo, function (error, processInfo) {
      if (error) {
        return this._logger.error('Failed to restart process', processInfo.name, error)
      }

      this.emit(prefix + ':restarted', processInfo)

      this._logger.debug('Restarted process', processInfo.name, 'as', processInfo.process.pid)
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
    return callback(new Error('Process ' + processInfo.name + ' is still running'))
  }

  this._processInfoStore.remove('id', id)

  callback()
}

module.exports = ProcessService
