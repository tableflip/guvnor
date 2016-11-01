var Autowire = require('wantsit').Autowire
var async = require('async')

var Actions = function () {
  this._connectOrStart = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._user = Autowire
  this._group = Autowire
}

Actions.prototype._parseStartProcessOpts = function (options) {
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
  if (opts.name && typeof opts.name !== 'string') {
    delete opts.name
  }

  for (var key in opts) {
    if (opts[key] === undefined) {
      delete opts[key]
    }
  }

  return opts
}

Actions.prototype._do = function (options, callback) {
  this._connectOrStart(function (error, guvnor) {
    if (error) {
      throw error
    }

    this._logMessages(guvnor)

    callback(guvnor)
  }.bind(this))
}

Actions.prototype._doAdmin = function (operation, options, callback) {
  this._connectOrStart(function (error, guvnor) {
    if (error) {
      throw error
    }

    this._logMessages(guvnor)

    if (guvnor[operation]) {
      callback(guvnor)
    } else {
      this._logger.warn('You do not appear to have sufficient permissions')
      guvnor.disconnect()
    }
  }.bind(this))
}

Actions.prototype._logMessages = function (guvnor) {
  guvnor.on('*', function () {
    var args = []

    Array.prototype.slice.call(arguments).forEach(function (arg) {
      try {
        var str = JSON.stringify(arg)

        if (!str) {
          return
        }
        var maxLength = 20000

        args.push(str.length > maxLength ? str.substr(0, maxLength) + '...' : str)
      } catch(e) {
        args.push('Could not serialise - ' + e.message)
      }
    })

    this._logger.debug.apply(this._logger, args)
  }.bind(this))
}

Actions.prototype._withEach = function (pidOrNames, options, withEach, afterAll) {
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

  afterAll = afterAll || function (errors) {
    if (errors.length) {
      throw errors[0]
    }
  }

  this._do(options, function (guvnor) {
    guvnor.listProcesses(function (error, processes) {
      if (error) {
        throw error
      }

      var tasks = []
      var errors = []

      pidOrNames.forEach(function (pidOrName) {
        processes.forEach(function (managedProcess) {
          var name = managedProcess.name

          if (managedProcess.cluster) {
            // remove the 'Cluster: ' from the cluster manager's name
            name = name.substring('Cluster: '.length)
          }
          //pidOrName maybe a number by user input
          if (name == pidOrName || managedProcess.pid === pidOrName || pidOrName === '*') {
            tasks.push(function (managedProcess, callback) {
              withEach(managedProcess, guvnor, function (error) {
                if (managedProcess && managedProcess.disconnect) {
                  managedProcess.disconnect(function (error) {
                    if (error) {
                      this._logger.debug('Error disconnecting from remote process', managedProcess.name, error)
                    } else {
                      this._logger.debug('Disconnected from remote process', managedProcess.name)
                    }
                  }.bind(this))
                }

                if (error) {
                  this._logger.debug(error)
                  errors.push(error)
                }

                callback()
              }.bind(this))
            }.bind(this, managedProcess))
          }
        }.bind(this))
      }.bind(this))

      async.parallel(tasks, function (error) {
        if (error) {
          errors.push(error)
        }

        guvnor.disconnect(function () {
          afterAll(errors)
        })
      })
    }.bind(this))
  }.bind(this))
}

module.exports = Actions
