var Autowire = require('wantsit').Autowire
var async = require('async')

var ProcessWrapper = function () {
  this._logger = Autowire
  this._parentProcess = Autowire
  this._userInfo = Autowire
  this._processRpc = Autowire
}

ProcessWrapper.prototype.afterPropertiesSet = function () {
  var script = process.env.GUVNOR_SCRIPT

  async.series([
    this._setProcessName.bind(this),
    this._processRpc.startDnodeServer.bind(this._processRpc),
    this._switchToUserAndGroup.bind(this),
    this._removePropertiesFromEnvironment.bind(this)
  ], function (error) {
      // this means we failed to start
      if (error) return this._parentProcess.send('process:failed', {
          date: Date.now(),
          message: error.message,
          code: error.code,
          stack: error.stack
        })

      this._startProcess(script, function (error) {
        // this means the user's module failed to start
        if (error) {
          this._parentProcess.send('process:errored', {
            date: Date.now(),
            message: error.message,
            code: error.code,
            stack: error.stack
          })

          throw error
        }

        // this means all is well
        this._parentProcess.send('process:started', this._processRpc.socket)
      }.bind(this))
    }.bind(this))
}

ProcessWrapper.prototype._startProcess = function (script, callback) {
  process.nextTick(function () {
    var error

    // this will execute the passed script
    try {
      if (script.substring(script.length - '.coffee'.length) === '.coffee') {
        require('coffee-script/register')
      }

      require(script)
    } catch (e) {
      error = e
    }

    callback(error)
  })
}

ProcessWrapper.prototype._setProcessName = function (callback) {
  process.title = process.env.GUVNOR_PROCESS_NAME

  callback()
}

// if we've been told to run as a different user or group (e.g. because they have fewer
// privileges), switch to that user before importing any third party application code.
ProcessWrapper.prototype._switchToUserAndGroup = function (callback) {
  try {
    this._logger.debug('Current owner', process.getuid(), process.getgid())

    if (process.getgid() !== this._userInfo.getGid()) {
      process.setgid(this._userInfo.getGid())
      process.setgroups([]) // Remove old groups
      process.initgroups(this._userInfo.getUid(), this._userInfo.getGid()) // Add user groups
    }

    if (process.getuid() !== this._userInfo.getUid()) {
      process.setuid(this._userInfo.getUid()) // Switch to requested user
    }

    this._logger.debug('Dropped privileges to %d:%d %s:%s', this._userInfo.getUid(), this._userInfo.getGid(), this._userInfo.getUserName(), this._userInfo.getGroupName())

    callback()
  } catch (error) {
    this._logger.error('Could not drop privileges of managed process - please run the guvnor daemon as root or a user that has the CAP_SETGID capability')
    this._logger.error('Attempted to set process gid to', this._userInfo.getGid())
    this._logger.error('Attempted to set process uid to', this._userInfo.getUid())

    var message = JSON.stringify(error)

    if (!message && error) {
      message = error.toString()
    }

    this._logger.error(message)

    callback(error)
  }
}

ProcessWrapper.prototype._removePropertiesFromEnvironment = function (callback) {
  // remove our properties
  for (var key in process.env) {
    if (key.substr(0, 6) === 'GUVNOR') {
      delete process.env[key]
    }
  }

  callback()
}

module.exports = ProcessWrapper
