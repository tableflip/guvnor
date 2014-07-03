var Autowire = require('wantsit').Autowire,
  fs = require('fs'),
  path = require('path'),
  file = require('file')

var FileSystem = function() {
  this._config = Autowire
  this._logger = Autowire
  this._remoteProcess = Autowire
}

FileSystem.prototype.pidFile = function(pid, callback) {
  //this._createFile(this.config.rundir + "/processes/" + pid, pid, callback)
}

FileSystem.prototype.findOrCreateLogFileDirectory = function(callback) {
  this._findOrCreateDirectory(this._config.boss.logdir, callback)
}

FileSystem.prototype.findOrCreateRunDirectory = function(callback) {
  this._findOrCreateDirectory(this._config.boss.rundir, callback)
}

FileSystem.prototype._findOrCreateDirectory = function(directory, callback) {
  fs.exists(directory, function (exists) {
    if (exists) {
      return callback(null, directory)
    }

    file.mkdirs(directory, 0770, function (error) {
      if(error) return callback(error)

      fs.chown(directory, process.getuid(), parseInt(this._config.boss.group, 10), function(error) {
        callback(error, directory)
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = FileSystem
