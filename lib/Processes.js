var Autowire = require('wantsit').Autowire,
  util = require('util'),
  Actions = require('./Actions'),
  Table = require('./Table'),
  path = require('path')

var Processes = function() {
  Actions.call(this)

  this._moment = Autowire
  this._formatMemory = Autowire
  this._fs = Autowire
}
util.inherits(Processes, Actions)

Processes.prototype.list = function(options) {
  this._do(options, function(boss) {
    boss.listProcesses(function(error, processes) {
      if(error) throw error

      var table = new Table('No running processes')
      table.addHeader(['PID', 'User', 'Group', 'Name', 'Uptime', 'Restarts', 'CPU', 'RSS', 'Heap size', 'Heap used', 'Status', 'Type'])

      var addProcessToTable = function(proc, type) {
        if(!proc) {
          return table.addRow(['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', type])
        }

        var pid = proc.pid ? proc.pid : '?',
          user = proc.user !== undefined ? proc.user : '?',
          group = proc.group !== undefined ? proc.group : '?',
          name = proc.name || '?',
          uptime = proc.uptime ? this._moment.duration(proc.uptime * 1000).humanize() : '?',
          restarts = proc.restarts !== undefined ? proc.restarts : '?',
          rss = proc.residentSize && isNaN(proc.residentSize) ? '?' : this._formatMemory(proc.residentSize, true),
          heapTotal = proc.heapTotal && isNaN(proc.heapTotal) ? '?' : this._formatMemory(proc.heapTotal, true),
          heapUsed = proc.heapUsed && isNaN(proc.heapUsed) ? '?' : this._formatMemory(proc.heapUsed, true),
          cpu = proc.cpu && isNaN(proc.cpu) ? '?' : proc.cpu.toFixed(2),
          status = !proc.status ? '?' : proc.status

        table.addRow([pid, user, group, name, uptime, restarts, cpu, rss, heapTotal, heapUsed, status, type])
      }.bind(this)

      processes.forEach(function (proc) {
        addProcessToTable(proc, proc.cluster ? 'Manager' : 'Process')

        if(proc.cluster && proc.workers) {
          proc.workers.forEach(function(worker) {
            addProcessToTable(worker, 'Worker')
          })
        }
      })

      table.print(console.info)

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Processes.prototype.start = function(scriptOrAppName, options) {
  var script = path.resolve(scriptOrAppName)

  if(!this._fs.existsSync(script)) {
    script = scriptOrAppName
  }

  var opts = this._parseStartProcessOpts(options)

  this._do(options, function(boss) {
    this._logger.debug('Starting process', script, opts)

    boss.startProcess(script, opts, function(error, processInfo) {
      if(error) {
        this._logger.error('Failed to start %s', script)
        this._logger.error(error)

        return boss.disconnect()
      }

      boss.on('process:forked', function(forkedProcessInfo) {
        if(!processInfo.id == forkedProcessInfo.id) {
          return
        }

        if(forkedProcessInfo.status == 'paused') {
          this._logger.warn('%s%s has been started in debug mode.', processInfo.cluster ? 'The cluster manager for' : '',  forkedProcessInfo.name)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', forkedProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      }.bind(this))

      boss.on('cluster:forked', function(clusterProcessInfo) {
        if(!processInfo.id == clusterProcessInfo.id) {
          return
        }

        if(clusterProcessInfo.status == 'paused') {
          this._logger.warn('The cluster manager for %s has been started in debug mode.', clusterProcessInfo.name)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', clusterProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      })

      boss.on('worker:forked', function(type, clusterProcessInfo, workerProcessInfo) {
        if(clusterProcessInfo.id != processInfo.id) {
          return
        }

        if(workerProcessInfo.status == 'paused') {
          this._logger.warn('%s has been started in debug mode.',  script)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', workerProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      })

      boss.on('cluster:online', function(clusterProcessInfo) {
        if(clusterProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.debug('%s started with pid %d', script, clusterProcessInfo.pid)

        boss.disconnect()
      }.bind(this))

      boss.on('process:ready', function(readyProcessInfo) {
        if(readyProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.debug('%s started with pid %d', script, readyProcessInfo.pid)

        boss.disconnect()
      }.bind(this))

      boss.on('process:aborted', function(abortedProcessInfo) {
        if(abortedProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.error('%s failed to start', abortedProcessInfo.name)

        boss.disconnect()
      }.bind(this))

      boss.on('process:errored', function(proc, error) {
        if(proc.id != processInfo.id) {
          return
        }

        this._logger.error(error.stack ? error.stack : error.message)
      })
    }.bind(this))
  }.bind(this))
}

Processes.prototype.stop = function(pidOrNames, options) {
  if (!Array.isArray(pidOrNames)) {
    pidOrNames = [pidOrNames]
  }

  this._do(options, function(boss) {
    var stopProcesses = function (pidOrNames) {
      var stoppedCount = 0
      var remoteError = null

      pidOrNames.forEach(function(pidOrName) {
        this._withRemoteProcess(boss, pidOrName, function(error, remoteProcess) {
          stoppedCount++

          if (error) {
            if(!remoteError) {
              remoteError = error
            } else {
              this._logger.error(error)
            }
          } else {
            this._logger.debug('Killing remote process ' + pidOrName)
            remoteProcess.kill()
            remoteProcess.disconnect()
          }

          if(stoppedCount == pidOrNames.length) {
            if(remoteError) throw remoteError
            boss.disconnect()
          }
        }.bind(this))
      }, this)
    }.bind(this)

    if(pidOrNames[0] == 'all') {
      this._logger.debug('Killing all remote processes')

      boss.listProcesses(function(error, processes) {
        if(error) throw error
        stopProcesses(processes.map(function (p) { return p.pid }))
      })
    } else {
      stopProcesses(pidOrNames)
    }
  }.bind(this))
}

Processes.prototype.restart = function(pidOrNames, options) {
  if (!Array.isArray(pidOrNames)) {
    pidOrNames = [pidOrNames]
  }

  this._do(options, function(boss) {
    var restartProcesses = function (pidOrNames) {
      var restartedCount = 0
      var remoteError = null

      pidOrNames.forEach(function(pidOrName) {
        this._withRemoteProcess(boss, pidOrName, function(error, remoteProcess) {
          restartedCount++

          if (error) {
            if(!remoteError) {
              remoteError = error
            } else {
              this._logger.error(error)
            }
          } else {
            this._logger.debug('Restarting remote process ' + pidOrName)
            remoteProcess.restart()
            remoteProcess.disconnect()
          }

          if(restartedCount == pidOrNames.length) {
            if(remoteError) throw remoteError
            boss.disconnect()
          }
        }.bind(this))
      }, this)
    }.bind(this)

    if(pidOrNames[0] == 'all') {
      this._logger.debug('Restarting all remote processes')

      boss.listProcesses(function(error, processes) {
        if(error) throw error
        restartProcesses(processes.map(function (p) { return p.pid }))
      })
    } else {
      restartProcesses(pidOrNames)
    }
  }.bind(this))
}

Processes.prototype.send = function(pidOrName, event, args, options) {
  if(!args) {
    args = []
  }

  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pidOrName, function(error, remoteProcess) {
      if (error) throw error

      args = [event].concat(args)

      this._logger.debug('Sending event to remote process', args)
      remoteProcess.send.apply(remoteProcess, args)
      remoteProcess.disconnect()
      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

Processes.prototype.signal = function(pidOrName, signal, options) {
  this._do(options, function(boss) {

    var method = 'findProcessInfoByPid'

    if(isNaN(pidOrName)) {
      method = 'findProcessInfoByName'
    }

    boss[method](pidOrName, function(error, processInfo) {
      if (error) throw error

      if(!processInfo) {
        this._logger.error('No process found for pid %d', pidOrName)

        boss.disconnect()
      }

      this._logger.debug('Sending signal %s to %d', signal, pidOrName)

      boss.sendSignal(processInfo.id, signal, function(error) {
        if (error) throw error

        this._logger.debug('Sent signal %s to %d', signal, pidOrName)

        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

Processes.prototype.heapdump = function(pidOrName, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pidOrName, function(error, remoteProcess, processInfo) {
      if (error) throw error

      this._logger.debug('Writing heap dump')
      remoteProcess.dumpHeap(function(error, path) {
        if(error) throw error

        console.info('Written heap dump to %s', path)
        remoteProcess.disconnect()
        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

Processes.prototype.gc = function(pidOrName, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pidOrName, function(error, remoteProcess, processInfo) {
      if (error) throw error

      this._logger.debug('Garbage collecting')
      remoteProcess.forceGc(function() {
        this._logger.debug('Garbage collected')
        remoteProcess.disconnect()
        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = Processes
