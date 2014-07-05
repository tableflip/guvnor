var Autowire = require('wantsit').Autowire,
  async = require('async')

var ProcessWrapper = function() {
  this._logger = Autowire
  this._parentProcess = Autowire
  this._userInfo = Autowire
}

ProcessWrapper.prototype.afterPropertiesSet = function() {
  async.series([
    this._setProcessName.bind(this),
    this._switchToUserAndGroup.bind(this),
    this._removeBossPropertiesFromEnvironment.bind(this),
    this._startProcess.bind(this, process.env.BOSS_SCRIPT)
  ], this._done.bind(this))
}

ProcessWrapper.prototype._done = function(error) {
  if(error) throw error

  this._parentProcess.send({type: 'process:ready'})
}

ProcessWrapper.prototype._startProcess = function(script, callback) {
  var error

  // this will execute the passed script
  try {
    require(script)
  } catch(e) {
    error = e
  }

  callback(error)
}

ProcessWrapper.prototype._setProcessName = function(callback) {
  process.title = process.env.BOSS_PROCESS_NAME

  callback()
}

// if we've been told to run as a different user or group (e.g. because they have fewer
// privileges), switch to that user before importing any third party application code.
ProcessWrapper.prototype._switchToUserAndGroup = function(callback) {
  try {
    process.setgid(this._userInfo.getGid())
    process.setgroups([]) // Remove old groups
    process.initgroups(this._userInfo.getUid(), this._userInfo.getGid()) // Add user groups
    process.setuid(this._userInfo.getUid()) // Switch to requested user

    this._logger.info('Dropped privileges to %d:%d %s:%s', this._userInfo.getUid(), this._userInfo.getGid(), this._userInfo.getUserName(), this._userInfo.getGroupName())

    callback()
  } catch(error) {
    this._logger.error('Could not drop privileges of managed process - please run the boss daemon as root or a user that has the CAP_SETGID capability')
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

ProcessWrapper.prototype._removeBossPropertiesFromEnvironment = function(callback) {
  // remove our properties
  for(var key in process.env) {
    if(key.substr(0, 4) == 'BOSS') {
      delete process.env[key]
    }
  }

  callback()
}

module.exports = ProcessWrapper
