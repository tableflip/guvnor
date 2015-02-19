var child_process = require('child_process'),
  Autowire = require('wantsit').Autowire

var LocalDaemonStarter = function() {
  this._client = false
  this._logger = Autowire
  this._config = Autowire
  this._freeport = Autowire
  this._posix = Autowire
  this._child_process = Autowire
}

LocalDaemonStarter.prototype.start = function(callback) {
  this._logger.debug('Starting daemon')

  if(this._config.debug.daemon) {
    var port = parseInt(this._config.debug.daemon, 10)

    if(isNaN(port)) {
      // no explicit debug port specified so choose a free port number
      this._freeport(function(error, port) {
        if(error) {
          return callback(error)
        }

        this._startDaemonWithDebugPort(callback, port)
      }.bind(this))
    } else {
      // explicit port specified
      this._startDaemonWithDebugPort(callback, port)
    }
  } else {
    this._startDaemonWithDebugPort(callback)
  }
}

LocalDaemonStarter.prototype._startDaemonWithDebugPort = function(callback, port) {
  var execArgv = [require.resolve('../daemon')]

  if(port) {
    this._logger.warn('The daemon will wait for a debugger connection on port %d before continuing', port)
    this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger)')
    execArgv.unshift('--debug-brk=' + port)
  }

  this._daemon = this._child_process.spawn(process.execPath, execArgv, {
    silent: false,
    detached: true,
    cwd: process.cwd(),
    stdio: ['ipc', 'ignore', 'ignore'],
    uid: this._posix.getpwnam(this._config.guvnor.user).uid,
    gid: this._posix.getgrnam(this._config.guvnor.group).gid
  })
  this._daemon.on('error', function(event) {
    this._logger.debug('Daemon encountered error', event)

    if(event.code == 'EPERM') {
      // this usually happens when the daemon was started by a user that cannot switch
      // to the user/group that the daemon is to run as
      this._logger.error('Daemon encountered a permissions error - did you start Guvnor with the right user?')
      process.exit(-1)
    }
  }.bind(this))
  this._daemon.on('exit', function(code, signal) {
    if(signal) {
      this._logger.debug('Daemon process exited with code %d and signal %s', code, signal)
    } else {
      this._logger.debug('Daemon process exited with code', code)
    }

    this._tearDownDaemon()
  }.bind(this))
  this._daemon.on('close', function(event) {
    this._logger.debug('Daemon process closed with code', event)

    this._tearDownDaemon()
  }.bind(this))
  this._daemon.on('disconnect', function() {
    this._logger.debug('Disconnected from Daemon process')
  }.bind(this))
  this._daemon.on('message', function(event) {
    if(event.type == 'daemon:config:request') {
      this._logger.debug('Daemon requested config')
      this._daemon.send({type: 'daemon:config:response', args: [this._config]})
    } else if(event.type == 'daemon:ready') {
      this._logger.debug('Daemon process online')
      this._daemon.disconnect()

      callback(undefined, event.data)
      callback = null
    } else if(event.type == 'daemon:fatality') {
      this._logger.debug('Daemon process encountered uncaught exception')

      this._daemon.kill()
      this._tearDownDaemon()

      var error = new Error(event.args[0].message)
      error.code = event.args[0].code
      error.stack = event.args[0].stack

      if(error.code == 'EACCES') {
        // this usually happens when the daemon was started by a non-privileged user and
        // it fails to read a log file created by a privileged user on a previous run
        error.message = 'Daemon encountered a permissions error - did you start Guvnor with the right user?'
      }

      if(callback) {
        callback(error)
        callback = null
      } else {
        throw error
      }
    } else {
      this._logger.debug('Daemon sent unhandled message', event)
    }
  }.bind(this))

  // allow the daemon to exist beyond the life of this process
  this._daemon.unref()
}

LocalDaemonStarter.prototype._tearDownDaemon = function() {
  if(this._daemon) {
    if(this._daemon.connected) {
      this._daemon.disconnect()
    }

    this._daemon.removeAllListeners('error')
    this._daemon.removeAllListeners('exit')
    this._daemon.removeAllListeners('close')
    this._daemon.removeAllListeners('disconnect')
    this._daemon.removeAllListeners('message')
    this._daemon = null
  }
}

LocalDaemonStarter.prototype.disconnect = function(callback) {
  this._tearDownDaemon()

  callback()
}

module.exports = LocalDaemonStarter
