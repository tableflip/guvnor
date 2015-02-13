var Autowire = require('wantsit').Autowire,
  util = require('util'),
  Actions = require('./Actions')

var Daemon = function() {
  Actions.call(this)

  this._running = Autowire
  this._commander = Autowire
}
util.inherits(Daemon, Actions)

Daemon.prototype.config = function(path, options) {
  var config = this._config
  var value = undefined

  path.split('.').forEach(function(section) {
    config = config[section]
    value = config
  })

  console.info(value)
}

Daemon.prototype.status = function(options) {
  this._running(function(running) {
    if(running) {
      console.info('Daemon is running')
    } else {
      console.info('Daemon is not running')
    }
  })
}

Daemon.prototype.kill = function(options) {
  if(arguments.length != 1) {
    this._logger.warn('You appear to have supplied arguments to \'' + this._commander._name + ' kill\'.')

    if(!isNaN(parseInt(arguments[0], 10))) {
      this._logger.warn('Did you perhaps mean \'' + this._commander._name + ' stop ' + arguments[0] + '\' instead?')
    }

    this._logger.warn('Cowardly refusing to run.')

    return
  }

  this._running(function(running) {
    if(!running) {
      return
    }

    this._doAdmin('kill', options, function(boss) {
      this._logger.debug('Killing remote daemon')
      boss.kill()
      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Daemon.prototype.logs = function(pid, options) {
  pid = parseInt(pid, 10)

  if(isNaN(pid)) {
    pid = '*'
  }

  var showLogs = function(boss, id) {
    var types = [
      'process:log:error', 'process:log:info', 'process:log:warn', 'process:log:debug',
      'worker:log:error', 'worker:log:info', 'worker:log:warn', 'worker:log:debug'
    ]
    types.forEach(function(type) {
      boss.on(type, function(type, processInfo, log) {
        if(id != '*' && processInfo.pid != id) {
          return
        }

        console.info('[%s] %s %s: %s', processInfo.pid, new Date(log.date), type, log.message)
      }.bind(null, type))
    })
  }

  this._do(options, function(boss) {
    showLogs(boss, pid)
  })
}

Daemon.prototype.dump = function(options) {
  this._do(options, function(boss) {
    boss.dumpProcesses(function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

Daemon.prototype.restore = function(options) {
  this._do(options, function(boss) {
    boss.restoreProcesses(function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

module.exports = Daemon
