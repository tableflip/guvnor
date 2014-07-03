var Autowire = require('wantsit').Autowire,
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  file = require('file')

var FileSystem = function() {
  this._config = Autowire
  this._logger = Autowire
  this._remoteProcess = Autowire
}

FileSystem.prototype.afterPropertiesSet = function() {

}

FileSystem.prototype._createDirectory = function(names, callback) {
  var path

  async.some(names, function(value, callback) {
      file.mkdirs(value, function(error) {
        if(!error) {
          path = value
        }

        callback(error ? false : true)
      })
    },
    function() {
      if(path) {
        callback(null, path)
      } else {
        this._remoteProcess.send({type: 'daemon:fatality', message: 'I tried to make a directory: ' + directory + ' but I couldn\'t. Please ensure that I am run as a user with sufficient permissions.'})
      }
    }.bind(this)
  )
}

FileSystem.prototype._createFile = function(name, directories, contents, callback) {
  this._createDirectory(directories, function(error, directory) {
    if(error) return callback(error)

    var path = directory + '/' + name

    fs.writeFile(path, contents, function(error) {
      callback(error, path)
    })
  })
}

FileSystem.prototype.pidFile = function(pid, callback) {
  //this._createFile(this.config.rundir + "/processes/" + pid, pid, callback)
}

FileSystem.prototype.findLogFile = function(file, callback) {
  async.filterSeries([
    '/var/log/boss/' + file,
    process.env.HOME + '/.boss/log/' + file
  ], function(logFile, callback) {
    fs.exists(logFile, function(exists) {

    }.bind(this))
  }.bind(this), function(results) {
    callback(results.length == 0 ? new Error('Could not find log file') : null, results[0])
  })
}

FileSystem.prototype.findSocket = function(callback) {
  async.filterSeries([
    '/var/run/boss/socket',
    process.env.HOME + '/.boss/run/socket'
  ], function(socket, callback) {
    fs.exists(socket, function(exists) {
      if(exists) {
        this._logger.debug('Found socket at', socket)

        // boss is already running
        return callback(true)
      }

      this._canWriteToFile(socket, callback)
    }.bind(this))
  }.bind(this), function(results) {
    callback(results.length == 0 ? new Error('Could not find socket file') : null, results[0])
  })
}

FileSystem.prototype.createSocket = function(callback) {
  async.filterSeries([
    '/var/run/boss/socket',
    process.env.HOME + '/.boss/run/socket'
  ], function(socket, callback) {
    fs.exists(socket, function(exists) {
      if(exists) {
        this._logger.warn(socket, 'already exists')

        // boss is already running
        return callback(false)
      }

      this._canWriteToFile(socket, callback)
    }.bind(this))
  }.bind(this), function(results) {
    callback(results.length == 0 ? new Error('Could not create socket file or socket file already exists') : null, results[0])
  })
}

FileSystem.prototype._canWriteToFile = function(filePath, callback) {
  // try to create the containing directory
  var containingDirectory = path.dirname(filePath)

  file.mkdirs(containingDirectory, 0700, function(error) {
    if(error) {
      // oops, give up
      return callback(false)
    }

    fs.writeFile(filePath, '', function(error) {
      if(error) {
        return callback(false)
      }

      fs.unlink(filePath, function(error) {
        if(error) {
          return callback(false)
        }

        callback(true)
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = FileSystem
