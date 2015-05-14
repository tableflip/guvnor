var Autowire = require('wantsit').Autowire
var util = require('util')
var Actions = require('./Actions')
var logger = require('winston')

var Daemon = function () {
  Actions.call(this)

  this._running = Autowire
  this._commander = Autowire
  this._stopDaemon = Autowire
}
util.inherits(Daemon, Actions)

Daemon.prototype.config = function (path) {
  var config = this._config
  var value = null

  path.split('.').forEach(function (section) {
    config = config[section]
    value = config
  })

  console.info(value)
}

Daemon.prototype.status = function () {
  logger.debug('Is daemon running')

  this._running(function (error, running) {
    if (error) {
      logger.error('Could not find out if daemon was running', error)

      return
    }

    if (running) {
      console.info('Daemon is running')
    } else {
      console.info('Daemon is not running')
    }
  })
}

Daemon.prototype.kill = function (options) {
  if (arguments.length !== 1) {
    this._logger.warn("You appear to have supplied arguments to '" + this._commander._name + " kill'.")

    if (!isNaN(parseInt(arguments[0], 10))) {
      this._logger.warn("Did you perhaps mean '" + this._commander._name + ' stop ' + arguments[0] + "' instead?")
    }

    this._logger.warn('Cowardly refusing to run.')

    return
  }

  this._running(function (error, running) {
    if (error) {
      return logger.error(error)
    }

    if (!running) {
      logger.debug('Daemon was not running')

      return
    }

    logger.debug('Daemon was running, stopping')

    this._stopDaemon(function (error) {
      if (error) {
        logger.error(error)
      }
    })
  }.bind(this))
}

Daemon.prototype.logs = function (pidOrNames, options) {
  pidOrNames = pidOrNames || '*'

  if (!Array.isArray(pidOrNames)) {
    pidOrNames = [pidOrNames]
  }

  pidOrNames = pidOrNames.map(function (pidOrName) {
    pidOrName = pidOrName.toString().trim()

    // does it contain non-numeric characters?
    if (pidOrName.match(/\D/)) {
      return pidOrName
    }

    // is it a number?
    var pid = parseInt(pidOrName, 10)

    return isNaN(pid) ? pidOrName : pid
  })

  var types = [
    'process:log:error', 'process:log:info', 'process:log:warn', 'process:log:debug',
    'worker:log:error', 'worker:log:info', 'worker:log:warn', 'worker:log:debug'
  ]

  this._do(options, function (guvnor) {
    types.forEach(function (type) {
      guvnor.on(type, function (type, managedProcess, log) {
        var result = pidOrNames.some(function (pidOrName) {
          if (pidOrName === '*' || pidOrName === managedProcess.name || pidOrName === managedProcess.pid) {
            return true
          }
        })

        if (!result) {
          return
        }

        console.info('[%s] %s %s %s', managedProcess.pid, new Date(log.date), type, log.message)
      }.bind(null, type))
    })
  })
}

Daemon.prototype.dump = function (options) {
  this._do(options, function (guvnor) {
    guvnor.dumpProcesses(function (error) {
      if (error) {
        throw error
      }

      guvnor.disconnect()
    })
  })
}

Daemon.prototype.restore = function (options) {
  this._do(options, function (guvnor) {
    guvnor.restoreProcesses(function (error) {
      if (error) {
        throw error
      }

      guvnor.disconnect()
    })
  })
}

module.exports = Daemon
