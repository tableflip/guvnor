var Autowire = require('wantsit').Autowire
var util = require('util')
var Actions = require('./Actions')
var Table = require('./Table')
var path = require('path')

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
      if (error) {
        throw error
      }

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

      if (processInfo.status === 'paused') {
        this._logger.warn('%s%s has been started in debug mode.', processInfo.cluster ? 'The cluster manager for' : '', processInfo.name)
        this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', processInfo.debugPort)
        this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
      }

      processInfo.once('process:uncaughtexception', function (error) {
        this._logger.warn('%s encountered %s', processInfo.name, error.message || error.stack)
      }.bind(this))

      processInfo.once('cluster:online', function () {
        this._logger.debug('%s started with pid %d', script, processInfo.pid)

        guvnor.disconnect()
      }.bind(this))

      processInfo.once('process:ready', function () {
        this._logger.debug('%s started with pid %d', script, processInfo.pid)

        guvnor.disconnect()
      }.bind(this))

      processInfo.once('process:aborted', function () {
        this._logger.error('%s failed to start', processInfo.name)

        guvnor.disconnect()
      }.bind(this))

      processInfo.once('process:errored', function (error) {
        this._logger.error(error.stack ? error.stack : error.message)
      })
    }.bind(this))
  }.bind(this))
}

Processes.prototype.stop = function (pidOrNames, options, callback) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Killing remote process', managedProcess.name)

    managedProcess.kill(function (error) {
      if (!error) {
        return done()
      }

      if (error && error.message === 'No socket defined') {
        guvnor.stopProcess(managedProcess.id, function (error) {
          if (error && error.code === 'EPERM') {
            this._logger.error(error.message)
          }

          done(error)
        }.bind(this))
      } else {
        done(error)
      }
    }.bind(this))
  }.bind(this), callback)
}

Processes.prototype.restart = function (pidOrNames, options) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Restarting remote process', managedProcess.name)

    managedProcess.restart(done)
  }.bind(this))
}

Processes.prototype.remove = function (pidOrNames, options) {
  // first stop any running processes
  this.stop(pidOrNames, options, function () {
    // then remove them
    this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
      this._logger.debug('Removing remote process ' + managedProcess.name)
      guvnor.removeProcess(managedProcess.id, done)
    }.bind(this))
  }.bind(this))
}

Processes.prototype.send = function (pidOrNames, event, args, options) {
  if (!args) {
    args = []
  }

  args = [event].concat(args)

  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Sending event to remote process', args)

    managedProcess.send.apply(managedProcess, args.concat(done))
  }.bind(this))
}

Processes.prototype.signal = function (pidOrNames, signal, options) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Sending signal %s to %d', signal, pidOrNames)

    managedProcess.signal(signal, done)
  }.bind(this))
}

Processes.prototype.heapdump = function (pidOrNames, options) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Writing heap dump')
    managedProcess.dumpHeap(function (error, snapshot) {
      if (!error) {
        console.info('Written heap dump to %s', snapshot.path)
      }

      done(error)
    })
  }.bind(this))
}

Processes.prototype.gc = function (pidOrNames, options) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Garbage collecting')
    managedProcess.forceGc(done)
  }.bind(this))
}

Processes.prototype.startWebMonitor = function (options) {
  options.name = 'guvnor-web'

  this.start(path.resolve(__dirname + '/../web'), options)
}

Processes.prototype.write = function (pidOrNames, string, options) {
  this._withEach(pidOrNames, options, function (managedProcess, guvnor, done) {
    this._logger.debug('Writing string', string)
    managedProcess.write(string, done)
  }.bind(this))
}

module.exports = Processes
