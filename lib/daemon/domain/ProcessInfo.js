var winston = require('winston')
var Autowire = require('wantsit').Autowire
var path = require('path')
var extend = require('extend')
var shortId = require('shortid')
var async = require('async')

function ProcessInfo (options) {
  if (!options || !options.script) {
    throw new Error('Please pass an options object to ProcessInfo constructor')
  }

  // make sure we don't keep shared references around
  options = JSON.parse(JSON.stringify(options))

  this.socket = undefined
  this.status = 'uninitialised'
  this.restarts = 0
  this.totalRestarts = 0

  // non-enumerables
  Object.defineProperties(this, {
    logger: {
      value: new winston.Logger({ transports: [] })
    },
    ready: {
      value: false,
      writable: true
    },
    remote: {
      value: false,
      writable: true
    },
    uid: {
      value: false,
      writable: true
    },
    gid: {
      value: false,
      writable: true
    },
    _process: {
      value: false,
      writable: true
    },
    _worker: {
      value: false,
      writable: true
    },
    process: {
      set: function (process) {
        if (process) {
          this.pid = process.pid
          process.on('message', function (message) {
            if (message && message.event) {
              process.emit.apply(process, [message.event].concat(message.args ? message.args : []))
            }
          })
        } else {
          this.pid = undefined
        }

        this._process = process
      }.bind(this),
      get: function () {
        return this._process
      }.bind(this)
    },
    worker: {
      set: function (worker) {
        this.process = worker.process
        this._worker = worker
      }.bind(this),
      get: function () {
        return this._worker
      }.bind(this)
    },
    _crashRecoveryTimeoutId: {
      value: false,
      writable: true
    },
    running: {
      get: function () {
        if (['uninitialised', 'starting', 'started', 'running', 'restarting', 'stopping'].indexOf(this.status) !== -1) {
          return true
        }

        return false
      }.bind(this)
    }
  })

  this.setOptions(options)

  this._config = Autowire
  this._child_process = Autowire
  this._fs = Autowire
  this._posix = Autowire
  this._fileSystem = Autowire
  this._semver = Autowire
}

ProcessInfo.prototype.setOptions = function (options) {
  // enumerable properties
  this.id = options.id || this.id || shortId.generate()
  this.script = options.script || this.script
  this.name = options.name || this.name || this._findName(options.script)
  this.restartOnError = options.restartOnError === false ? false : true
  this.restartRetries = !isNaN(options.restartRetries) ? options.restartRetries : this.restartRetries || 5
  this.argv = options.argv || []
  this.execArgv = options.execArgv || this.execArgv || []
  this.env = options.env || this.env || {}
  this.debug = options.debug === false || options.debug === true ? options.debug : this.debug || false
  this.instances = !isNaN(options.instances) ? options.instances : this.instances || 1
  this.cluster = this.instances > 1 ? true : false
  this.debugPort = options.debugPort || this.debugPort || undefined
  this.app = options.app || this.app || undefined
  this.manager = options.manager || this.manager || undefined

  // remove any debug flags as we will add them again later
  this.execArgv = this.execArgv.filter(function (element) {
    return element.toString().indexOf('--debug') === -1
  })

  this.cwd = options.cwd || this.cwd
  this.user = options.user || this.user
  this.group = options.group || this.group
}

ProcessInfo.prototype._findName = function (script) {
  try {
    // try to read an app name from package.json if available
    var pkg = require(path.dirname(script) + '/package.json')

    if (pkg.name) {
      return pkg.name
    }
  } catch (e) {}

  return path.basename(script)
}

ProcessInfo.prototype.getProcessArgs = function () {
  return this.argv
}

ProcessInfo.prototype.getProcessExecArgs = function () {
  var execArgs = JSON.parse(JSON.stringify(this.execArgv))

  // remove existing debug port from execArgv
  execArgs = execArgs.filter(function (element) {
    return element.toString().indexOf('--debug') === -1
  })

  // node 0.10 used --debug=PORT, node 0.12 and io.js use --debug-port=PORT
  // see https://github.com/joyent/node/commit/43ec1b1c2e77d21c7571acd39860b9783aaf5175
  var portArg = '--debug='

  if (this._semver.gt(process.version, '0.11.0')) {
    portArg = '--debug-port='
  }

  if (this.cluster) {
    if (this._config.debug.cluster) {
      execArgs.push('--debug-brk=' + this.debugPort)
      this.status = 'paused'
    } else {
      execArgs.push(portArg + this.debugPort)
    }
  } else if (this.debug) {
    execArgs.push('--debug-brk=' + this.debugPort)
    this.status = 'paused'
  } else if (this.debugPort) {
    // set a global debug port in case we want to debug this process later
    execArgs.push(portArg + this.debugPort)
  }

  if (execArgs.indexOf('--expose_gc') === -1) {
    execArgs.push('--expose_gc')
  }

  return execArgs
}

ProcessInfo.prototype.getProcessOptions = function () {
  var output = {
    cwd: this.cwd,
    execArgv: this.getProcessExecArgs(),
    silent: true,
    env: extend({}, this.env, {
      GUVNOR_SCRIPT: this.script,
      GUVNOR_PROCESS_NAME: this.name,
      GUVNOR_RUN_AS_USER: this.user,
      GUVNOR_RUN_AS_GROUP: this.group
    })
  }

  if (this.cluster) {
    output.env.GUVNOR_NUM_PROCESSES = this.instances
    output.env.GUVNOR_CLUSTER_DEBUG = this.debug
    output.env.GUVNOR_IS_CLUSTER = true
    output.env.GUVNOR_CLUSTER_DEBUG_PORT = this.debugPort
    output.env.GUVNOR_CLUSTER_MANAGER = this.id
  }

  return output
}

ProcessInfo.prototype.validate = function (callback) {
  async.auto({
    check_user_and_group: this._checkUserAndGroup.bind(this),
    update_log: ['check_user_and_group', this._updateLogger.bind(this)],
    check_script_exists: this._checkScriptExists.bind(this),
    take_cwd_from_script: ['check_script_exists', this._takeCwdFromScript.bind(this)],
    check_cwd_exists: ['check_script_exists', 'take_cwd_from_script', this._checkCwdExists.bind(this)]
  }, callback)
}

ProcessInfo.prototype._checkUserAndGroup = function (callback) {
  try {
    var user = this._posix.getpwnam(this.user || process.getuid())
    var group = this._posix.getgrnam(this.group || process.getgid())

    this.user = user.name
    this.group = group.name
    this.uid = user.uid
    this.gid = group.gid

    callback()
  } catch (error) {
    error.code = 'INVALID'

    callback(error)
  }
}

ProcessInfo.prototype._updateLogger = function (callback) {
  try {
    this.logger.remove(winston.transports.DailyRotateFile)
  } catch (error) {
    // this will throw if there is no logger set
  }

  var fileLogger = new winston.transports.DailyRotateFile({
    filename: this._fileSystem.getLogDir() + '/' + this.name + '.log',
    stripColors: true
  })
  fileLogger.once('open', function (fileName) {
    this._fs.chown(fileName, this.uid, this.gid, callback)
  }.bind(this))
  this.logger.add(fileLogger, null, true)

  // first log line triggers creation of the log file
  this.logger.info('Process started at', new Date())
}

ProcessInfo.prototype._checkScriptExists = function (callback) {
  this._fs.exists(this.script, function (exists) {
    if (!exists) {
      var error = new Error('Script ' + this.script + ' does not exist')
      error.code = 'INVALID'

      return callback(error)
    }

    callback()
  }.bind(this))
}

ProcessInfo.prototype._takeCwdFromScript = function (callback) {
  if (this.cwd) {
    return callback()
  }

  this._fs.stat(this.script, function (error, stats) {
    if (error) {
      callback(error)

      return
    }

    if (stats.isDirectory()) {
      this.cwd = this.script
    } else {
      this.cwd = path.dirname(this.script)
    }

    callback()
  }.bind(this))
}

ProcessInfo.prototype._checkCwdExists = function (callback) {
  this._fs.exists(this.cwd, function (exists) {
    if (!exists) {
      var error = new Error('Current working directory ' + this.cwd + ' does not exist')
      error.code = 'INVALID'

      return callback(error)
    }

    return callback()
  }.bind(this))
}

module.exports = ProcessInfo
