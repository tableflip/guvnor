var Autowire = require('wantsit').Autowire,
  child_process = require('child_process'),
  path = require('path'),
  async = require('async'),
  extend = require('extend'),
  ProcessInfo = require('./ProcessInfo')

var Boss = function() {
  this._logger = Autowire
  this._fileSystem = Autowire
  this._processes = {} // {pid: ProcessInfo}

  // shut down all managed processes on exit
  process.on('exit', function() {
    Object.keys(this._processes).forEach(function(pid) {
      this._processes[pid].process.kill()
    }, this)
  }.bind(this))

  process.on('message', function(message) {
    this._logger.debug('incoming message', message)
  }.bind(this))
}

Boss.prototype.afterPropertiesSet = function() {
  process.title = 'boss'
}

/**
 * Start a new NodeJS process
 *
 * @param {String} script The path to the NodeJS script to start
 * @param {Object} options
 * @param {Number} [options.instances] The number of instances to start (1)
 * @param {String} [options.name] Name to give the process (script filename)
 * @param {String|Number} [options.user] User name or uid to start the process as (current user)
 * @param {String|Number} [options.group] Group name or gid to start the process as (current group)
 * @param {Boolean} [options.restartOnError] Restart the process automatically when it exits abnormally (true)
 * @param {Number} [options.restartRetries] Number of times the process can be restarted when crashing (5)
 * @oaram {Number} [options.crashRecoveryPeriod] The time before the process is considered to not be crashing (5000ms)
 * @param {Object} [options.env] Process environment key/value pairs
 * @param {Function} callback Called on successful process start or on startup error
 * @returns {Number} PID of the process that was started
 */
Boss.prototype.startProcess = function(script, options, callback) {
  var processInfo = null

  // Allow start with an existing ProcessInfo
  if(script instanceof ProcessInfo) {
    processInfo = script
    script = processInfo.script
    callback = options
    options = processInfo.options
  }

  options.name = options.name || path.basename(script)

  var starter

  var opts = {
    silent: true,
    //detached: true,
    cwd: path.dirname(script),
    env: extend({}, options.env, {
      BOSS_SCRIPT: script,
      BOSS_PROCESS_NAME: options.name,
      BOSS_RUN_AS_USER: options.user || process.getuid(),
      BOSS_RUN_AS_GROUP: options.group || process.getgid()
    })
  }

  if(options.instances && options.instances > 1) {
    this._logger.debug('Starting new cluster', script)
    opts.env.BOSS_NUM_PROCESSES = options.instances
    starter = child_process.fork(path.resolve(__dirname, './cluster'), opts)
    starter.cluster = true
  } else {
    this._logger.debug('Starting new process', script)
    starter = child_process.fork(path.resolve(__dirname, './process'), opts)
    starter.cluster = false
  }

  starter.ready = false

  if(processInfo) {
    processInfo.process = starter
  } else {
    processInfo = new ProcessInfo(script, starter, options, this._fileSystem)
  }

  this._processes[starter.pid] = processInfo

  starter.on('message', function(event) {
    if(event.type == 'process:ready') {
      this._logger.debug('Child process', script, 'ready')
      starter.ready = true
      callback(null, starter.pid)
    }

    if(event.type == 'process:stopping') {
      this._logger.debug('stopping', starter.pid)

      delete this._processes[starter.pid]
    }

    if(event.type == 'process:uncaughtexception') {
      this._logger.error('Child process', starter.pid, 'experienced an uncaught exception', event.error)
      processInfo.logger.error(event.error)
    }

    if(event.type == 'log:stdout') {
      processInfo.logger.info(event.message)
    }

    if(event.type == 'log:stderr') {
      processInfo.logger.error(event.message)
    }
  }.bind(this))

  // Note that the exit-event may or may not fire after an error has occured.
  // http://nodejs.org/api/child_process.html#child_process_event_error

  starter.on('exit', function(code, signal) {
    this._logger.debug('Child process', script, starter.pid, 'exited with code', code, 'and signal', signal)

    if(this._processes[starter.pid]) {
      if(!starter.ready) {
        callback(new Error('Child process exited with code ' + code + ' before it was ready'))
      }

      if(code === null || code > 0) {
        this._restartProcess(this._processes[starter.pid])
      }
    }
  }.bind(this))

  starter.on('error', function(error) {
    this._logger.error('Child process', script, 'emitted error event', error)

    if(this._processes[starter.pid]) {
      if(!starter.ready) {
        callback(error)
      }

      this._restartProcess(this._processes[starter.pid])
    }
  }.bind(this))

  return starter.pid
}

/**
 * Restart a failed process, provided it is configured to be restarted, and hasn't errd too many times.
 */
Boss.prototype._restartProcess = function(failedProcess) {
  var failedPid = failedProcess.process.pid

  if(failedProcess.options.restartOnError) {
    failedProcess.stillCrashing()

    if(failedProcess.restarts < failedProcess.options.restartRetries) {
      this._logger.debug('Restarting process', failedProcess.script, failedPid, 'x', failedProcess.restarts)

      var pid = this.startProcess(failedProcess, function(error) {
        if(error) {
          return this._logger.error('Failed to restart process', failedProcess.script, failedPid, error)
        }
        this._logger.debug('Restarted process', failedProcess.script, failedPid, 'as', pid)
      }.bind(this))
    }
  }

  delete this._processes[failedPid]
}

Boss.prototype.setClusterWorkers = function(pid, workers, callback) {
  var processInfo = this._processes[pid]

  if(!processInfo) {
    return callback(new Error('There is no process with the pid ' + pid))
  }

  if(!processInfo.options.cluster) {
    return callback(new Error(pid + ' is not a cluster'))
  }

  processInfo.process.send({type: 'boss:numworkers', workers: workers})

  callback()
}

Boss.prototype.listProcesses = function(callback) {
  var procList = Object.keys(this._processes).map(function(pid) {
    return this._processes[pid]
  }, this)

  async.parallel(procList.map(function(processInfo) {
    return function(callback) {
      var statusTimeoutId

      function onMessage(event) {
        if(event && event.type == 'process:status') {
          clearTimeout(statusTimeoutId)
          processInfo.process.removeListener('message', onMessage)
          event.status.restarts = processInfo.totalRestarts
          callback(null, event.status)
        }
      }

      // Listen for a state update
      processInfo.process.on('message', onMessage)

      // Don't wait forever!
      statusTimeoutId = setTimeout(function() {
        this._logger.warn('Timeout requesting status for process', processInfo.process.pid)
        processInfo.process.removeListener('message', onMessage)
        callback(null, {pid: processInfo.process.pid})
      }.bind(this), 5000)

      this._logger.debug('Requesting status for process', processInfo.process.pid)

      // Ask the process to report it's state
      processInfo.process.send({type: 'boss:status'})
    }.bind(this)
  }.bind(this)), callback)
}

module.exports = Boss
