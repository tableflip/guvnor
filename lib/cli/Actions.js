var path = require('path'),
  Autowire = require('wantsit').Autowire

var Actions = function() {
  this._connectOrStart = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._user = Autowire
  this._group = Autowire
}

Actions.prototype._parseStartProcessOpts = function(options) {
  var opts = {
    user: options.user || this._user.name,
    group: options.group || this._group.name,
    instances: options.instances || undefined,
    name: options.name || undefined,
    argv: options.argv || undefined,
    execArgv: options.execArgv || undefined,
    debug: options.debug || undefined,
    env: options.env || process.env
  }

  // resolve conflict with commander's name() method
  if(opts.name && typeof(opts.name) != 'string') {
    delete opts.name
  }

  for(var key in opts) {
    if(opts[key] === undefined) {
      delete opts[key]
    }
  }

  return opts
}

Actions.prototype._do = function(options, callback) {
  this._connectOrStart(function(error, guvnor) {
    if(error) throw error
    this._logMessages(guvnor)

    callback(guvnor)
  }.bind(this))
}

Actions.prototype._doAdmin = function(operation, options, callback) {
  this._connectOrStart(function(error, guvnor) {
    if(error) throw error
    this._logMessages(guvnor)

    if(guvnor[operation]) {
      callback(guvnor)
    } else {
      this._logger.warn('You do not appear to have sufficient permissions')
      guvnor.disconnect()
    }
  }.bind(this))
}

Actions.prototype._logMessages = function(guvnor) {
  guvnor.on('*', function() {
    var args = []

    Array.prototype.slice.call(arguments).forEach(function(arg) {
      var str = JSON.stringify(arg)

      if(!str) {
        return
      }

      var maxLength = 20000

      args.push(str.length > maxLength ? str.substr(0, maxLength) + '...' : str)
    })

    this._logger.debug.apply(this._logger, args)
  }.bind(this))
}

Actions.prototype._withRemoteProcess = function(guvnor, pid, callback) {
  this._logger.debug('Connected, finding process info for %s', pid)

  var method = 'findProcessInfoByPid'

  if(isNaN(pid)) {
    method = 'findProcessInfoByName'
  }

  guvnor[method](pid, function(error, processInfo) {
    if(error) {
      return callback(error)
    }
    if(!processInfo) {
      return callback(new Error('No process exists for ' + pid))
    }

    this._logger.debug('Found process info for %s, connecting to process', pid)

    guvnor.connectToProcess(processInfo.id, function(error, remote) {
      if(error) {
        if(error.code == 'EACCES') {
          this._logger.error('I don\'t have permission to access the process %s please run guvnor as a user that can.', pid)
        } else if(error.code == 'ENOENT') {
          this._logger.error('No process was found for %s', pid)
        } else if(error.code == 'ECONNREFUSED') {
          this._logger.error('Connection to remote process was refused')
        } else {
          this._logger.debug('Could not connect to process', error.toString())
        }
      } else if(!remote) {
        error = new Error('Process ' + pid + ' is invalid')
      } else {
        this._logger.debug('Connecting to process %s', pid)
      }

      callback(error, processInfo, remote)
    }.bind(this))
  }.bind(this))
}

module.exports = Actions
