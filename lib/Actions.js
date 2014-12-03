var path = require('path'),
  Autowire = require('wantsit').Autowire

var Actions = function() {
  this._connect = Autowire
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
  this._connect(function(error, boss) {
    if(error) throw error
    this._logBossMessages(boss)

    callback(boss)
  }.bind(this))
}

Actions.prototype._doAdmin = function(operation, options, callback) {
  this._connect(function(error, boss) {
    if(error) throw error
    this._logBossMessages(boss)

    if(boss[operation]) {
      callback(boss)
    } else {
      this._logger.warn('You do not appear to have sufficient permissions')
      boss.disconnect()
    }
  }.bind(this))
}

Actions.prototype._logBossMessages = function(boss) {
  boss.on('*', function() {
    var args = []

    Array.prototype.slice.call(arguments).forEach(function(arg) {
      var str = JSON.stringify(arg)

      if(!str) {
        return
      }

      var maxLength = 100

      args.push(str.length > maxLength ? str.substr(0, maxLength) + '...' : str)
    })

    this._logger.debug.apply(this._logger, args)
  }.bind(this))
}

Actions.prototype._withRemoteProcess = function(boss, pid, callback) {
  this._logger.debug('Connected, finding process info for pid %s', pid)

  var method = 'findProcessInfoByPid'

  if(isNaN(pid)) {
    method = 'findProcessInfoByName'
  }

  boss[method](pid, function(error, processInfo) {
    if(error) return callback(error)
    if(!processInfo) return callback(new Error('No process exists for ' + pid))

    boss.connectToProcess(processInfo.id, function(error, remote) {
      if(error) {
        if(error.code == 'EACCES') {
          this._logger.error('I don\'t have permission to access the process %s please run boss as a user that can.', pid)
        } else if(error.code == 'ENOENT') {
          this._logger.error('No process was found for %s', pid)
        } else if(error.code == 'ECONNREFUSED') {
          this._logger.error('Connection to remote process was refused')
        }

        return callback(error)
      }

      if(!remote) {
        return callback(new Error('Process ' + pid + ' is invalid'))
      }

      callback(error, remote, processInfo)
    }.bind(this))
  }.bind(this))
}

module.exports = Actions
