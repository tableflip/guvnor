var Autowire = require('wantsit').Autowire
var util = require('util')
var Actions = require('./Actions')
var Table = require('./Table')
var path = require('path')
var async = require('async')

var Processes = function () {
  Actions.call(this)

  this._moment = Autowire
  this._formatMemory = Autowire
  this._fs = Autowire
}
util.inherits(Processes, Actions)

Processes.prototype.list = function (options) {
  this._do(options, function (guvnor) {
    guvnor.listProcesses(function (error, processes) {
      if (error)
        throw error

      var table = new Table('No running processes')
      table.addHeader(['PID', 'User', 'Group', 'Name', 'Uptime', 'Restarts', 'CPU', 'RSS', 'Heap size', 'Heap used', 'Status', 'Type'])

      var addProcessToTable = function (proc, type) {
        if (!proc) {
          return table.addRow(['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', type])
        }

        var pid = proc.pid == null ? '?' : proc.pid
        var user = proc.user == null ? '?' : proc.user
        var group = proc.group == null ? '?' : proc.group
        var name = proc.name == null ? '?' : proc.name
        var uptime = proc.uptime == null || isNaN(proc.uptime) ? '?' : this._moment.duration(proc.uptime * 1000).humanize()
        var restarts = proc.restarts == null ? '?' : proc.restarts
        var rss = proc.residentSize == null || isNaN(proc.residentSize) ? '?' : this._formatMemory(proc.residentSize, true)
        var heapTotal = proc.heapTotal == null || isNaN(proc.heapTotal) ? '?' : this._formatMemory(proc.heapTotal, true)
        var heapUsed = proc.heapUsed == null || isNaN(proc.heapUsed) ? '?' : this._formatMemory(proc.heapUsed, true)
        var cpu = proc.cpu == null || isNaN(proc.cpu) ? '?' : proc.cpu.toFixed(2)
        var status = proc.status == null ? '?' : proc.status

        table.addRow([pid, user, group, name, uptime, restarts, cpu, rss, heapTotal, heapUsed, status, type])
      }.bind(this)

      processes.forEach(function (proc) {
        addProcessToTable(proc, proc.cluster ? 'Manager' : 'Process')

        if (proc.cluster && proc.workers) {
          proc.workers.forEach(function (worker) {
            addProcessToTable(worker, 'Worker')
          })
        }
      })

      table.print(console.info)

      guvnor.disconnect()
    }.bind(this))
  }.bind(this))
}

Processes.prototype.start = function (scriptOrAppName, options) {
  var script = path.resolve(scriptOrAppName)

  if (!this._fs.existsSync(script)) {
    script = scriptOrAppName
  }

  var opts = this._parseStartProcessOpts(options)

  var method = this._do.bind(this)
  var operation = 'startProcess'

  if (options.user && options.user !== this._user.name) {
    this._logger.debug('Using admin socket to start process because', options.user, '!=', this._user.name)

    operation = 'startProcessAsUser'
    method = this._doAdmin.bind(this, operation)
  }

  method(options, function (guvnor) {
    this._logger.debug('Starting process', script, opts)

    guvnor[operation](script, opts, function (error, processInfo) {
      if (error) {
        this._logger.error('Failed to start %s', script)
        this._logger.error(error)

        return guvnor.disconnect()
      }

      guvnor.on('process:forked', function (forkedProcessInfo) {
        if (processInfo.id !== forkedProcessInfo.id) {
          return
        }

        if (forkedProcessInfo.status === 'paused') {
          this._logger.warn('%s%s has been started in debug mode.', processInfo.cluster ? 'The cluster manager for' : '', forkedProcessInfo.name)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', forkedProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      }.bind(this))

      guvnor.on('cluster:forked', function (clusterProcessInfo) {
        if (processInfo.id !== clusterProcessInfo.id) {
          return
        }

        if (clusterProcessInfo.status === 'paused') {
          this._logger.warn('The cluster manager for %s has been started in debug mode.', clusterProcessInfo.name)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', clusterProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      })

      guvnor.on('worker:forked', function (type, clusterProcessInfo, workerProcessInfo) {
        if (clusterProcessInfo.id !== processInfo.id) {
          return
        }

        if (workerProcessInfo.status === 'paused') {
          this._logger.warn('%s has been started in debug mode.', script)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', workerProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      })

      guvnor.on('process:uncaughtexception', function (procInfo, error) {
        if (procInfo.id !== processInfo.id) {
          return
        }

        this._logger.warn('%s encountered %s', procInfo.name, error.message || error.stack)
      }.bind(this))

      guvnor.on('cluster:online', function (clusterProcessInfo) {
        if (clusterProcessInfo.id !== processInfo.id) {
          return
        }

        this._logger.debug('%s started with pid %d', script, clusterProcessInfo.pid)

        guvnor.disconnect()
      }.bind(this))

      guvnor.on('process:ready', function (readyProcessInfo) {
        if (readyProcessInfo.id !== processInfo.id) {
          return
        }

        this._logger.debug('%s started with pid %d', script, readyProcessInfo.pid)

        guvnor.disconnect()
      }.bind(this))

      guvnor.on('process:aborted', function (abortedProcessInfo) {
        if (abortedProcessInfo.id !== processInfo.id) {
          return
        }

        this._logger.error('%s failed to start', abortedProcessInfo.name)

        guvnor.disconnect()
      }.bind(this))

      guvnor.on('process:errored', function (proc, error) {
        if (proc.id !== processInfo.id) {
          return
        }

        this._logger.error(error.stack ? error.stack : error.message)
      })
    }.bind(this))
  }.bind(this))
}

Processes.prototype.stop = function (pidOrNames, options, callback) {
  this._withEach(pidOrNames, options, function (processInfo, remoteProcess, guvnor, done) {
    if (!processInfo) {
      this._logger.debug('No process found')

      return done()
    }

    if (!remoteProcess) {
      this._logger.debug('Not killing remote process', processInfo.name)

      return done()
    }

    this._logger.debug('Killing remote process', processInfo.name)

    remoteProcess.kill(done)
  }.bind(this), function (errors) {
      if (callback) {
        callback(errors.length ? errors[0] : undefined)
      } else if (errors.length) {
        throw errors[0]
      }
    })
}

Processes.prototype.restart = function (pidOrNames, options) {
  this._withEach(pidOrNames, options, function (processInfo, remoteProcess, guvnor, done) {
    if (!processInfo || !remoteProcess) {
      this._logger.debug('No process found')

      return done()
    }

    this._logger.debug('Restarting remote process', processInfo.name)

    remoteProcess.restart(done)
  }.bind(this), function (errors) {
      if (errors.length)
        throw errors[0]
    })
}

Processes.prototype.remove = function (pidOrNames, options) {
  // first stop any running processes
  this.stop(pidOrNames, options, function () {
    // then remove them
    this._withEach(pidOrNames, options, function (processInfo, _, guvnor, done) {
      if (!processInfo) {
        this._logger.debug('No process found')

        return done()
      }

      this._logger.debug('Removing remote process ' + processInfo.name)
      guvnor.removeProcess(processInfo.id, done)
    }.bind(this), function (errors) {
        if (errors.length)
          throw errors[0]
      })
  }.bind(this))
}

Processes.prototype._withEach = function (pidOrNames, options, withEach, afterAll) {
  if (!Array.isArray(pidOrNames)) {
    pidOrNames = [pidOrNames]
  }

  this._do(options, function (guvnor) {
    var tasks = []
    var errors = []

    var action = function (pidOrNames) {
      pidOrNames.forEach(function (pidOrName) {
        tasks.push(function (callback) {
          this._withRemoteProcess(guvnor, pidOrName, function (error, processInfo, remoteProcess) {
            if (error) {
              errors.push(error)
            }

            withEach(processInfo, remoteProcess, guvnor, function (error) {
              if (remoteProcess && remoteProcess.disconnect) {
                remoteProcess.disconnect()
              }

              if (error) {
                this._logger.debug(error)
                errors.push(error)
              }

              callback()
            }.bind(this))
          }.bind(this))
        }.bind(this))
      }, this)
    }.bind(this)

    if (pidOrNames[0] === 'all' || pidOrNames[0] === '*') {
      this._logger.debug('Operating on all remote processes')

      guvnor.listProcesses(function (error, processes) {
        if (error)
          throw error
        action(processes.map(function (p) {
          return p.pid
        }))
      })
    } else {
      action(pidOrNames)
    }

    async.parallel(tasks, function (error) {
      if (error) {
        errors.push(error)
      }

      guvnor.disconnect(function () {
        afterAll(errors)
      })
    })
  }.bind(this))
}

Processes.prototype.send = function (pidOrName, event, args, options) {
  if (!args) {
    args = []
  }

  this._do(options, function (guvnor) {
    this._withRemoteProcess(guvnor, pidOrName, function (error, processInfo, remoteProcess) {
      if (error)
        throw error

      args = [event].concat(args)

      this._logger.debug('Sending event to remote process', args)
      remoteProcess.send.apply(remoteProcess, args)
      remoteProcess.disconnect()
      guvnor.disconnect()
    }.bind(this))
  }.bind(this))
}

Processes.prototype.signal = function (pidOrName, signal, options) {
  this._do(options, function (guvnor) {
    var method = 'findProcessInfoByPid'

    if (isNaN(pidOrName)) {
      method = 'findProcessInfoByName'
    }

    guvnor[method](pidOrName, function (error, processInfo) {
      if (error)
        throw error

      if (!processInfo) {
        this._logger.error('No process found for pid %d', pidOrName)

        return guvnor.disconnect()
      }

      this._logger.debug('Sending signal %s to %d', signal, pidOrName)

      guvnor.sendSignal(processInfo.id, signal, function (error) {
        if (error)
          throw error

        this._logger.debug('Sent signal %s to %d', signal, pidOrName)

        guvnor.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

Processes.prototype.heapdump = function (pidOrName, options) {
  this._do(options, function (guvnor) {
    this._withRemoteProcess(guvnor, pidOrName, function (error, processInfo, remoteProcess) {
      if (error)
        throw error

      this._logger.debug('Writing heap dump')
      remoteProcess.dumpHeap(function (error, path) {
        if (error)
          throw error

        console.info('Written heap dump to %s', path)
        remoteProcess.disconnect()
        guvnor.disconnect()
      })
    }.bind(this))
  }.bind(this))
}

Processes.prototype.gc = function (pidOrName, options) {
  this._do(options, function (guvnor) {
    this._withRemoteProcess(guvnor, pidOrName, function (error, processInfo, remoteProcess) {
      if (error)
        throw error

      this._logger.debug('Garbage collecting')
      remoteProcess.forceGc(function () {
        this._logger.debug('Garbage collected')
        remoteProcess.disconnect()
        guvnor.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

Processes.prototype.startWebMonitor = function (options) {
  options.name = 'guvnor-web'

  this.start(path.resolve(__dirname + '/../web'), options)
}

Processes.prototype.write = function (pidOrName, string, options) {
  this._do(options, function (boss) {
    this._withRemoteProcess(boss, pidOrName, function (error, processInfo, remoteProcess) {
      if (error)
        throw error

      this._logger.debug('Writing string', string)
      remoteProcess.write(string, function () {
        this._logger.debug('Wrote string')
        remoteProcess.disconnect()
        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = Processes
