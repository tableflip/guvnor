var Autowire = require('wantsit').Autowire

var FileSystem = function () {
  this._config = Autowire
  this._logger = Autowire
  this._posix = Autowire
  this._fs = Autowire
  this._mkdirp = Autowire
}

FileSystem.prototype.afterPropertiesSet = function () {
  this._createDirectorySync(this._config.guvnor.logdir, parseInt('0770', 8))
  this._createDirectorySync(this._config.guvnor.rundir, parseInt('0770', 8))
  this._createDirectorySync(this._config.guvnor.rundir + '/processes', parseInt('0770', 8))
  this._createDirectorySync(this._config.guvnor.confdir, parseInt('0770', 8))
  this._createDirectorySync(this._config.guvnor.appdir, parseInt('0770', 8))
}

FileSystem.prototype.getRunDir = function () {
  return this._config.guvnor.rundir
}

FileSystem.prototype.getLogDir = function () {
  return this._config.guvnor.logdir
}

FileSystem.prototype.getConfDir = function () {
  return this._config.guvnor.confdir
}

FileSystem.prototype.getAppDir = function () {
  return this._config.guvnor.appdir
}

FileSystem.prototype._createDirectorySync = function (directory, mode) {
  var gid = this._posix.getgrnam(this._config.guvnor.group).gid
  var oldmask = process.umask()

  try {
    if (this._fs.existsSync(directory)) {
      return
    }

    this._logger.debug('Creating', directory, 'with mode', mode.toString(8))

    oldmask = process.umask(0)
    this._mkdirp.sync(directory, {
      mode: mode
    })
    process.umask(oldmask)

    this._fs.chownSync(directory, process.getuid(), gid)
  } catch (error) {
    process.umask(oldmask)

    // we've been run as a non-root user
    if (error.code === 'EACCES') {
      this._logger.error('I do not have permission to create', directory, '- please run me as a privileged user.')
      process.exit(-1)
    }

    throw error
  }
}

module.exports = FileSystem
