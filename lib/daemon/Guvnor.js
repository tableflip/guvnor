var Autowire = require('wantsit').Autowire
var async = require('async')
var EventEmitter = require('wildemitter')
var util = require('util')

var Guvnor = function () {
  EventEmitter.call(this, {
    wildcard: true,
    delimiter: ':'
  })

  this._config = Autowire
  this._logger = Autowire
  this._processService = Autowire
  this._fs = Autowire
  this._usage = Autowire
  this._cpuStats = Autowire
  this._remoteUserService = Autowire
  this._nodeInspectorWrapper = Autowire
  this._os = Autowire
  this._appService = Autowire
  this._pem = Autowire
  this._ini = Autowire
  this._posix = Autowire
  this._etc_passwd = Autowire

  this._processInfoStore = Autowire
  this._processInfoStoreFactory = Autowire
}
util.inherits(Guvnor, EventEmitter)

Guvnor.prototype.afterPropertiesSet = function (done) {
  process.title = 'guvnor'

  var tasks = []

  if (this._config.guvnor.autoresume) {
    tasks = this._processInfoStore.all().map(function (processInfo) {
      return function (callback) {
        this._processService.startProcess(processInfo, function (error) {
          if (error) {
            this._logger.error('Error resuming process', processInfo.name, error)
          }

          // don't pass the error callback because if we do, we'll abort resuming the rest of the processes
          callback()
        }.bind(this))
      }.bind(this)
    }.bind(this))
  }

  async.series(tasks, done)
}

/**
 * Start a new NodeJS process
 *
 * @param {String} script The path to the NodeJS script to start
 * @param {Object} options
 * @param {Number} [options.instances] The number of instances to start (1)
 * @param {String} [options.name] Name to give the process (script filename)
 * @param {String|Number} [options.user] User name or uid to start the process as (current user)
 * @param {String|Number} [options.group] Group name or gid to start the process as (current group)
 * @param {Boolean} [options.restartOnError] Restart the process automatically when it exits abnormally (true)
 * @param {Number} [options.restartRetries] Number of times the process can be restarted when crashing (5)
 * @oaram {Number} [options.crashRecoveryPeriod] The time before the process is considered to not be crashing (5000ms)
 * @param {Object} [options.env] Process environment key/value pairs
 * @param {Function} callback Called on successful process start or on startup error
 * @returns {Number} PID of the process that was started
 */
Guvnor.prototype.startProcess = function (userDetails, script, options, callback) {
  var appInfo = this._appService.findByName(script)

  if (appInfo) {
    options.script = appInfo.path
    options.app = appInfo.id
    options.name = appInfo.name
  }

  this._processService.startProcess(script, options, callback)
}

// this is exposed as an admin rpc function..
Guvnor.prototype.startProcessAsUser = function (userDetails, script, options, callback) {
  this.startProcess(userDetails, script, options, callback)
}

Guvnor.prototype.stopProcess = function (userDetails, id, callback) {
  var processInfo = this._processService.findById(id)

  if (!processInfo) {
    return callback(new Error('No process found for id ' + id))
  }

  if (processInfo.status === 'running') {
    return callback(new Error('Process ' + processInfo.name + ' is running, use it\'s RPC service to kill it'))
  }

  // if the user is root, or the user is the one that owns the process or is in the same group as the process owner
  if (userDetails.name === this._config.guvnor.user || userDetails.name === processInfo.user || userDetails.groups.indexOf(processInfo.group) !== -1) {
    if (processInfo.process && processInfo.process.kill) {
      processInfo.process.emit('process:stopping')
      processInfo.process.kill()
      callback()
      return
    }

    callback(new Error('Could not kill process'))
  } else {
    var error = new Error('Permission denied')
    error.code = 'EPERM'

    callback(error)
  }
}

Guvnor.prototype.removeProcess = function (userDetails, id, callback) {
  this._processService.removeProcess(id, callback)
}

Guvnor.prototype.getServerStatus = function (userDetails, callback) {
  this._cpuStats(function (error, stats) {
    var status = {
      time: Date.now(),
      uptime: this._os.uptime(),
      freeMemory: this._os.freemem(),
      totalMemory: this._os.totalmem(),
      cpus: this._os.cpus(),
      debuggerPort: this._config.remote.inspector.enabled ? this._nodeInspectorWrapper.debuggerPort : undefined
    }

    if (!error) {
      stats.forEach(function (load, index) {
        status.cpus[index].load = load
      })
    }

    callback(error, status)
  }.bind(this))
}

Guvnor.prototype.listUsers = function (userDetails, callback) {
  this._etc_passwd.getGroups(function listGroups (error, groups) {
    if (error) {
      return callback(error)
    }

    var users = []

    // only return groups without the _ prefix
    groups.filter(function removeHiddenGroups (group) {
      return group.groupname.substring(0, 1) !== '_'
    }).map(function convertToGroupName (group) {
      return group.groupname
    }).forEach(function listGroupUsers (group) {
      this._posix.getgrnam(group).members.filter(function removeHiddenUsers (user) {
        return user.substring(0, 1) !== '_'
      }).forEach(function findUserGroups (username) {
        var user = users.reduce(function addUserToListIfNecessary (prev, current) {
          if (prev) {
            return prev
          }

          if (current.name === username) {
            return current
          }
        }, null)

        if (!user) {
          var pwnam = this._posix.getpwnam(username)
          var grname = this._posix.getgrnam(pwnam.gid)

          user = {
            uid: pwnam.uid,
            name: pwnam.name,
            group: grname.name,
            groups: []
          }

          users.push(user)
        }

        user.groups.push(group)
      }.bind(this))
    }.bind(this))

    callback(undefined, users)
  }.bind(this))
}

Guvnor.prototype.listProcesses = function (userDetails, callback) {
  async.parallel(this._processService.listProcesses().map(function (processInfo) {
    return function (callback) {
      var language = processInfo.script.substring(processInfo.script.length - '.coffee'.length) === '.coffee' ? 'coffee' : 'javascript'

      if (!processInfo.remote || processInfo.status !== 'running') {
        // this process is not ready yet
        return callback(undefined, {
          id: processInfo.id,
          name: processInfo.name,
          restarts: processInfo.totalRestarts,
          status: processInfo.status,
          script: processInfo.script,
          debugPort: processInfo.debugPort,
          user: processInfo.user,
          group: processInfo.group,
          cwd: processInfo.cwd,
          argv: processInfo.argv,
          execArgv: processInfo.execArgv,
          pid: processInfo.pid,
          language: language
        })
      }

      processInfo.remote.reportStatus(function (error, status) {
        var processStatus = processInfo.status

        if (error && error.code === 'TIMEOUT') {
          processStatus = 'unresponsive'
        }

        status = status || {}
        status.restarts = processInfo.totalRestarts
        status.id = processInfo.id
        status.script = processInfo.script
        status.debugPort = processInfo.debugPort
        status.status = processStatus
        status.language = language
        status.socket = processInfo.socket

        callback(undefined, status)
      })
    }
  }), callback)
}

Guvnor.prototype.findProcessInfoById = function (userDetails, id, callback) {
  callback(undefined, this._processService.findById(id))
}

Guvnor.prototype.findProcessInfoByPid = function (userDetails, pid, callback) {
  callback(undefined, this._processService.findByPid(pid))
}

Guvnor.prototype.findProcessInfoByName = function (userDetails, name, callback) {
  callback(undefined, this._processService.findByName(name))
}

Guvnor.prototype.dumpProcesses = function (userDetails, callback) {
  this._processInfoStore.save(function (error) {
    callback(error)

    this.emit('daemon:dump')
  }.bind(this))
}

Guvnor.prototype.restoreProcesses = function (userDetails, callback) {
  this._processInfoStoreFactory.create(['processInfoFactory', 'processes.json'], function (error, store) {
    if (error) return callback(error)

    async.series(store.all().map(function (processInfo) {
      return this._processService.startProcess.bind(this._processService, processInfo.script, processInfo)
    }.bind(this)), function (error, result) {
      callback(error, result)
      this.emit('daemon:restore')
    }.bind(this))
  }.bind(this))
}

Guvnor.prototype.kill = function (userDetails, callback) {
  this._nodeInspectorWrapper.stopNodeInspector()
  this._processService.killAll()

  if (this._config.guvnor.autoresume) {
    this.dumpProcesses(userDetails, this._kill.bind(this, callback))
  } else {
    this._kill(callback)
  }
}

Guvnor.prototype._kill = function (callback, error) {
  if (callback) {
    callback(error)
  }

  this.emit('daemon:exit')
  process.nextTick(process.exit.bind(process, 0))
}

Guvnor.prototype.remoteHostConfig = function (userDetails, callback) {
  this._remoteUserService.findOrCreateUser(this._config.guvnor.user, function (error, user) {
    callback(
      error,
      this._os.hostname(),
      this._config.remote.port,
      this._config.guvnor.user,
      user.secret
    )
  }.bind(this))
}

Guvnor.prototype.addRemoteUser = function (userDetails, userName, callback) {
  this._remoteUserService.createUser(userName, callback)
}

Guvnor.prototype.removeRemoteUser = function (userDetails, userName, callback) {
  if (userName === this._config.guvnor.user) {
    var error = new Error('Cowardly refusing to delete ' + this._config.guvnor.user)
    error.code = 'WILLNOTREMOVEGUVNORUSER'

    return callback(error)
  }

  this._remoteUserService.removeUser(userName, callback)
}

Guvnor.prototype.listRemoteUsers = function (userDetails, callback) {
  this._remoteUserService.listUsers(callback)
}

Guvnor.prototype.rotateRemoteUserKeys = function (userDetails, userName, callback) {
  this._remoteUserService.rotateKeys(userName, callback)
}

Guvnor.prototype.deployApplication = function (userDetails, name, url, user, onOut, onErr, callback) {
  this._appService.deploy(name, url, user, onOut, onErr, callback)
}

Guvnor.prototype.removeApplication = function (userDetails, name, callback) {
  this._appService.remove(name, callback)
}

Guvnor.prototype.listApplications = function (userDetails, callback) {
  this._appService.list(callback)
}

Guvnor.prototype.switchApplicationRef = function (userDetails, name, ref, onOut, onErr, callback) {
  this._appService.switchRef(name, ref, onOut, onErr, callback)
}

Guvnor.prototype.listApplicationRefs = function (userDetails, name, callback) {
  this._appService.listRefs(name, callback)
}

Guvnor.prototype.updateApplicationRefs = function (userDetails, name, onOut, onError, callback) {
  this._appService.updateRefs(name, onOut, onError, callback)
}

Guvnor.prototype.currentRef = function (userDetails, name, callback) {
  this._appService.currentRef(name, callback)
}

Guvnor.prototype.generateRemoteRpcCertificates = function (userDetails, days, callback) {
  this._pem.createCertificate({
    days: days,
    selfSigned: true
  }, function (error, keys) {
    if (error) {
      callback(error)

      return
    }

    var keyPath = this._config.guvnor.confdir + '/rpc.key'
    var certPath = this._config.guvnor.confdir + '/rpc.cert'
    var configPath = this._config.guvnor.confdir + '/guvnor'

    async.parallel([
      this._fs.writeFile.bind(this._fs, keyPath, keys.serviceKey, {
        mode: parseInt('0600', 8)
      }),
      this._fs.writeFile.bind(this._fs, certPath, keys.certificate, {
        mode: parseInt('0600', 8)
      })
    ], function (error) {
      if (error) {
        callback(error)

        return
      }

      this._fs.readFile(configPath, 'utf-8', function (error, result) {
        if (error && error.code !== 'ENOENT') {
          callback(error)

          return
        }

        var config = {}

        if (result) {
          config = this._ini.parse(result)
        }

        config.remote = config.remote || {}
        config.remote.key = keyPath
        config.remote.certificate = certPath

        this._fs.writeFile(configPath, this._ini.stringify(config), {
          mode: parseInt('0600', 8)
        }, function (error) {
          callback(error, configPath)

          this.emit('daemon:genssl')
        }.bind(this))
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

module.exports = Guvnor
