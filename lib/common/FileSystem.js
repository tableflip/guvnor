var Autowire = require('wantsit').Autowire,
  fs = require('fs'),
  path = require('path'),
  file = require('file'),
  posix = require('posix')

var FileSystem = function() {
  this._config = Autowire
}

FileSystem.prototype.findProcessDirectory = function() {
  return this._config.boss.rundir + '/processes'
}

FileSystem.prototype.findOrCreateProcessDirectory = function(callback) {
  this._findOrCreateDirectory(this.findProcessDirectory(), callback)
}

FileSystem.prototype.findOrCreateLogFileDirectory = function(callback) {
  this._findOrCreateDirectory(this._config.boss.logdir, callback)
}

FileSystem.prototype.findOrCreateRunDirectory = function(callback) {
  this._findOrCreateDirectory(this._config.boss.rundir, callback)
}

FileSystem.prototype._findOrCreateDirectory = function(directory, callback) {
  var group = posix.getgrnam(this._config.boss.group)

  fs.exists(directory, function (exists) {
    if (exists) {
      return callback(null, directory)
    }

    var oldmask = process.umask(0)
    file.mkdirs(directory, 0770, function (error) {
      process.umask(oldmask)

      if(error) return callback(error)

      fs.chown(directory, process.getuid(), group.gid, function(error) {
        callback(error, directory)
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = FileSystem
