var commander = require('commander'),
  pkg = require('../package.json'),
  path = require('path'),
  Autowire = require('wantsit').Autowire,
  suit = require('./suit'),
  formatMemory = require('prettysize'),
  userid = require('userid'),
  Table = require('./Table'),
  os = require('os'),
  moment = require('moment')

require('colors')

// monkey patch until https://github.com/tj/commander.js/issues/289 is resolved
commander.normalize = function(args) {
  var ret = []
    , arg
    , lastOpt
    , index
    , subcommand;

  // find subcommand - horrifically naive - just look for the first argument
  // not prefixed with a dash
  for (var i = 0, len = args.length; i < len; ++i) {
    if(args[i].substring(0, 1) != '-') {
      subcommand = this.findCommand(args[i])

      break
    }
  }

  for (var i = 0, len = args.length; i < len; ++i) {
    arg = args[i];
    if (i > 0) {
      lastOpt = this.optionFor(subcommand, args[i-1]);
    }

    if (arg === '--') {
      // Honor option terminator
      ret = ret.concat(args.slice(i));
      break;
    } else if (lastOpt && lastOpt.required) {
      ret.push(arg);
    } else if (arg.length > 1 && '-' == arg[0] && '-' != arg[1]) {
      arg.slice(1).split('').forEach(function(c) {
        ret.push('-' + c);
      });
    } else if (/^--/.test(arg) && ~(index = arg.indexOf('='))) {
      ret.push(arg.slice(0, index), arg.slice(index + 1));
    } else {
      ret.push(arg);
    }
  }

  return ret;
};

commander.findCommand = function(subcommand) {
  if(!subcommand) {
    return
  }

  for(var i = 0; i < this.commands.length; i++) {
    if(this.commands[i]._name == subcommand) {
      return this.commands[i]
    }
  }
}

commander.optionFor = function(subcommand, arg) {
  var options = this.options

  if(subcommand && subcommand.options) {
    options = subcommand.options
  }

  for (var i = 0, len = options.length; i < len; ++i) {
    if (options[i].is(arg)) {
      return options[i];
    }
  }
};

var CLI = function() {
  this._connect = Autowire
  this._running = Autowire
  this._logger = Autowire
  this._config = Autowire
}

CLI.prototype.afterPropertiesSet = function() {
  commander
    .version(pkg.version)

  commander
    .command('list')
      .description('List all running processes')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.list.bind(this))

  commander
    .command('start <script>')
      .description('Start a process')
      .option('-u, --user <user>', 'The user to start a process as')
      .option('-g, --group <group>', 'The group to start a process as')
      .option('-i, --instances <instances>', 'How many instances of the process to start', parseInt)
      .option('-n, --name <name>', 'What name to give the process')
      .option('-a, --argv <argv>', 'A space separated list of arguments to pass to a process', this._parseList, [])
      .option('-e, --execArgv <execArgv>', 'A space separated list of arguments to pass to the node executable', this._parseList, [])
      .option('-d, --debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.start.bind(this))

  commander
    .command('cluster <pid> <workers>')
      .description('Set the number of workers managed by the cluster manager with the passed pid')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.setClusterWorkers.bind(this))

  commander
    .command('stop <pid>')
      .description('Stop a process')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.stop.bind(this))

  commander
    .command('restart <pid>')
    .description('Restart a process')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.restart.bind(this))

  commander
    .command('send <pid> <event> [args...]')
      .description('Causes process.emit(event, args[0], args[1]...) to occur in the process')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.send.bind(this))

  commander
    .command('heapdump <pid>')
      .description('Write out a snapshot of the processes memory for inspection')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.heapdump.bind(this))

  commander
    .command('gc <pid>')
    .description('Force garbage collection to occur in the process with the passed pid')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.gc.bind(this))

  commander
    .command('kill')
      .description('Stop all processes and kill the daemon')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.kill.bind(this))

  commander
    .command('signal <pid> <signal>')
    .description('Sends a signal to a process (SIGUSR1, SIGINT, SIGHUP, SIGTERM, etc)')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.signal.bind(this))

  commander
    .command('logs [pid]')
      .description('Show realtime process logs, optionally filtering by pid')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.logs.bind(this))

  commander
    .command('dump')
      .description('Dumps process data to ' + this._config.boss.rundir + '/processes.json')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.dump.bind(this))

  commander
    .command('restore')
      .description('Restores processes from ' + this._config.boss.rundir + '/processes.json')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this.restore.bind(this))

  commander
    .command('remoteconfig [hostname]')
    .description('Prints the remote host config for boss-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.remoteHostConfig.bind(this))

  commander
    .command('useradd <username> [hostname]')
    .description('Adds a user for use with boss-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.addRemoteUser.bind(this))

  commander
    .command('rmuser <username>')
    .description('Removes a user from the boss-web user list')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.deleteRemoteUser.bind(this))

  commander
    .command('lsusers')
    .description('Prints out all remote users')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.listRemoteUsers.bind(this))

  commander
    .command('reset <username>')
    .description('Generate a new secret for the passed user')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.rotateRemoteUserKeys.bind(this))

  commander
    .command('config <path>')
    .description('Print a config option')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.config.bind(this))

  commander
    .command('status')
    .description('Returns whether the daemon is running or not')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.status.bind(this))

  commander
    .command('deploy <name> <url>')
    .description('Deploys an application from a git repository')
    .option('-u, --user <user>', 'The user to deploy as - n.b. the current user must be able to su to that user')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.deployApplication.bind(this))

  commander
    .command('lsapps')
    .description('List applications that have been deployed from git repositories')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.listApplications.bind(this))

  commander
    .command('rmapp <name>')
    .description('Remote deployed application')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.removeApplication.bind(this))

  commander
    .command('startapp <name> [ref]')
    .description('Start a deployed application')
    .option('-u, --user <user>', 'The user to start a process as')
    .option('-g, --group <group>', 'The group to start a process as')
    .option('-i, --instances <instances>', 'How many instances of the process to start', parseInt)
    .option('-a, --argv <argv>', 'A space separated list of arguments to pass to a process', this._parseList, [])
    .option('-e, --execArgv <execArgv>', 'A space separated list of arguments to pass to the node executable', this._parseList, [])
    .option('-d, --debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this.runApplication.bind(this))

  commander.on('--help', function() {
    console.log(suit)
  })

  commander
    .command('*')
    .description('')
    .action(this.unknown.bind(this))

  var program = commander.parse(process.argv)

  // No command
  if(program.args.length == 0) {
    this.list()
  }
}

// takes ['foo', '"bar', 'baz"'] and turns it into ['foo', 'bar baz']
CLI.prototype._parseList = function(value) {
  if(!value) {
    return []
  }

  var output = []
  var token = ''
  var ignoreNext
  var inBlock
  var blockDelimiter

  value.split('').forEach(function(char) {
    if(char == '\\') {
      ignoreNext = true
      return
    }

    if(ignoreNext) {
      ignoreNext = false
      token += char
      return
    }

    if((char == '"' || char == "'") && !inBlock) {
      inBlock = true
      blockDelimiter = char
      //token += char
      return
    }

    if(inBlock) {
      if(char != blockDelimiter) {
        token += char
      }

      if(char == blockDelimiter) {
        inBlock = false
        blockDelimiter = null
        output.push(token)
        token = ''
      }
    } else if(char == ' ') {
      output.push(token)
      token = ''
    } else {
      token += char
    }
  })

  if(token.trim()) {
    output.push(token)
  }

  return output
}

CLI.prototype.list = function(options) {
  this._do(options, function(boss) {
    boss.listProcesses(function(error, processes) {
      if(error) throw error

      var table = new Table('No running processes')
      table.addHeader(['pid', 'user', 'group', 'name', 'uptime', 'restarts', 'cpu', 'rss', 'heap size', 'heap used', 'status', 'type'])

      var addProcessToTable = function(proc, type) {
        if(!proc) {
          return table.addRow(['?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', type])
        }

        var pid = proc.pid ? proc.pid : '?',
          user = proc.user !== undefined ? proc.user : '?',
          group = proc.group !== undefined ? proc.group : '?',
          name = proc.name || '?',
          uptime = proc.uptime ? moment.duration(proc.uptime * 1000).humanize() : '?',
          restarts = proc.restarts !== undefined ? proc.restarts : '?',
          rss = isNaN(proc.residentSize) ? '?' : formatMemory(proc.residentSize, true),
          heapTotal = isNaN(proc.heapTotal) ? '?' : formatMemory(proc.heapTotal, true),
          heapUsed = isNaN(proc.heapUsed) ? '?' : formatMemory(proc.heapUsed, true),
          cpu = isNaN(proc.cpu) ? '?' : proc.cpu.toFixed(2),
          status = !proc.status ? '?' : proc.status

        table.addRow([pid, user, group, name, uptime, restarts, cpu, rss, heapTotal, heapUsed, status, type])
      }

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

CLI.prototype.start = function(script, options) {
  script = path.resolve(script)

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

      boss.on('process:restarted', function(restartedProcessInfo) {
        if(restartedProcessInfo.id != processInfo.id) {
          return
        }

        if(restartedProcessInfo.status == 'paused') {
          this._logger.warn('%s has been started in debug mode.',  script)
          this._logger.warn('It is paused and listening on port %d for a debugger to attach before continuing.', restartedProcessInfo.debugPort)
          this._logger.warn('Please connect a debugger to this port (e.g. node-inspector or node-debugger).')
        }
      }.bind(this))

      boss.on('cluster:online', function(clusterProcessInfo) {
        if(clusterProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.info('%s started with pid %d', script, clusterProcessInfo.pid)

        boss.disconnect()
      }.bind(this))

      boss.on('process:ready', function(readyProcessInfo) {
        if(readyProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.info('%s started with pid %d', script, readyProcessInfo.pid)

        boss.disconnect()
      }.bind(this))

      boss.on('process:aborted', function(abortedProcessInfo) {
        if(abortedProcessInfo.id != processInfo.id) {
          return
        }

        this._logger.error('%s failed to start', abortedProcessInfo.name)

        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

CLI.prototype._parseStartProcessOpts = function(options) {
  var opts = {
    user: options.user || userid.username(process.getuid()),
    group: options.group || userid.groupname(process.getgid()),
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

CLI.prototype.stop = function(pid, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess) {
      if (error) throw error

      this._logger.debug('Killing remote process')
      remoteProcess.kill()
      remoteProcess.disconnect()
      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.restart = function(pid, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess) {
      if (error) throw error

      this._logger.debug('Restarting remote process')
      remoteProcess.restart()
      remoteProcess.disconnect()
      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.send = function(pid, event, args, options) {
  if(!args) {
    args = []
  }

  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess) {
      if (error) throw error

      args = [event].concat(args)

      this._logger.debug('Sending event to remote process', args)
      remoteProcess.send.apply(remoteProcess, args)
      remoteProcess.disconnect()
      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.signal = function(pid, signal, options) {
  this._do(options, function(boss) {

    boss.findProcessInfoByPid(pid, function(error, processInfo) {
      if (error) throw error

      if(!processInfo) {
        this._logger.error('No process found for pid %d', pid)

        boss.disconnect()
      }

      this._logger.debug('Sending signal %s to %d', signal, pid)

      boss.sendSignal(processInfo.id, signal, function(error) {
        if (error) throw error

        this._logger.debug('Sent signal %s to %d', signal, pid)

        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

CLI.prototype.heapdump = function(pid, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess, processInfo) {
      if (error) throw error

      this._logger.debug('Writing heap dump')
      remoteProcess.dumpHeap(function(error, path) {
        if(error) throw error

        console.info('Written heap dump to %s/%s', processInfo.cwd, path)
        remoteProcess.disconnect()
        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

CLI.prototype.gc = function(pid, options) {
  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess, processInfo) {
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

CLI.prototype.setClusterWorkers = function(pid, workers, options) {
  workers = parseInt(workers, 10)

  if(isNaN(workers)) {
    return this._logger.error('Please pass a number for cluster workers')
  }

  this._do(options, function(boss) {
    this._withRemoteProcess(boss, pid, function(error, remoteProcess, processInfo) {
      remoteProcess.setClusterWorkers(workers, function(error) {
        if(error) {
          this._logger.error(error.stack ? error.stack : error.message)
        }

        remoteProcess.disconnect()
        boss.disconnect()
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

CLI.prototype.kill = function(options) {
  if(arguments.length != 1) {
    this._logger.warn('You appear to have supplied arguments to \'' + commander._name + ' kill\'.')

    if(!isNaN(parseInt(arguments[0], 10))) {
      this._logger.warn('Did you perhaps mean \'' + commander._name + ' stop ' + arguments[0] + '\' instead?')
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

CLI.prototype.logs = function(pid, options) {
  pid = parseInt(pid, 10)

  if(isNaN(pid)) {
    pid = '*'
  }

  var showLogs = function(boss, id) {
    var types = ['error', 'info', 'warn', 'debug']
    types.forEach(function(type) {
      boss.on('process:log:' + type, function(type, processInfo, log) {
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

CLI.prototype.dump = function(options) {
  this._do(options, function(boss) {
    boss.dumpProcesses(function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

CLI.prototype.restore = function(options) {
  this._do(options, function(boss) {
    boss.restoreProcesses(function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

CLI.prototype.remoteHostConfig = function(host, options) {
  this._doAdmin('remoteHostConfig', options, function(boss) {
    boss.remoteHostConfig(function(error, hostname, port, user, secret) {
      if(error) throw error

      if(!host) {
        host = hostname.replace(/\./, '-')
      }

      console.info('')
      console.info('Add the following to your bossweb-hosts file:')
      console.info('')
      console.info('[%s]'.cyan, host)
      console.info('  host = %s'.cyan, hostname)
      console.info('  port = %d'.cyan, port)
      console.info('  user = %s'.cyan, user)
      console.info('  secret = %s'.cyan, secret)
      console.info('')

      boss.disconnect()
    }.bind(this))
  })
}

CLI.prototype.addRemoteUser = function(userName, hostName, options) {
  this._doAdmin('addRemoteUser', options, function(boss) {
    boss.addRemoteUser(userName, function(error, user) {
      if(error) {
        if(error.code == 'DUPLICATEUSER') {
          this._logger.error('A user named %s already exists', userName)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Added user', userName, user)

      console.info('')
      console.info('Add the following to your bossweb-users file:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, os.hostname().replace(/\./, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')
      console.info('If %s is not in your config file yet, run `bs-web passwd %s` to generate the appropriate configuration', userName, userName)

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.deleteRemoteUser = function(userName, options) {
  this._doAdmin('removeRemoteUser', options, function(boss) {
    boss.removeRemoteUser(userName, function(error) {
      if(error) {
        if(error.code == 'WILLNOTREMOVEBOSSUSER') {
          this._logger.error(error.message)
          return process.exit(1)
        }

        throw error
      }

      this._logger.debug('Removed user', userName)

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.listRemoteUsers = function(options) {
  this._doAdmin('listRemoteUsers', options, function(boss) {
    boss.listRemoteUsers(function(error, users) {
      if(error) throw error

      if(users.length == 0) {
        console.info('No remote users')
      } else {
        Object.keys(users).forEach(function(userName) {
          console.info(userName)
        })
      }

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.rotateRemoteUserKeys = function(userName, options) {
  this._doAdmin('rotateRemoteUserKeys', options, function(boss) {
    boss.rotateRemoteUserKeys(userName, function(error, user) {
      if(error) throw error

      this._logger.debug('Removed user', userName)

      console.info('')
      console.info('Update your bossweb-users file with the following:')
      console.info('')
      console.info('[%s.%s]'.cyan, userName, os.hostname().replace(/\./g, '-'))
      console.info('  secret = %s'.cyan, user.secret)
      console.info('')

      boss.disconnect()
    }.bind(this))
  }.bind(this))
}

CLI.prototype.config = function(path, options) {
  this._setLoggingLevel(options)

  var config = this._config
  var value = undefined

  path.split('.').forEach(function(section) {
    config = config[section]
    value = config
  })

  console.info(value)
}

CLI.prototype.status = function(options) {
  this._setLoggingLevel(options)

  this._running(function(running) {
    if(running) {
      console.info('Daemon is running')
    } else {
      console.info('Daemon is not running')
    }
  })
}

CLI.prototype.deployApplication = function(name, url, options) {
  this._do(options, function(boss) {
    var opts = {
      user: options.user || userid.username(process.getuid())
    }

    boss.deployApplication(name, url, opts, function(info) {
      console.info(info)
    }, function(err) {
      console.error(err)
    }, function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

CLI.prototype.listApplications = function(options) {
  this._do(options, function(boss) {
    boss.listApplications(function(error, deployedApplications) {
      if(error) throw error

      deployedApplications.forEach(function(app) {
        console.info(app.name)
      })

      boss.disconnect()
    })
  }.bind(this))
}

CLI.prototype.removeApplication = function(name, options) {
  this._do(options, function(boss) {
    boss.removeApplication(name, function(error) {
      if(error) throw error

      boss.disconnect()
    })
  }.bind(this))
}

CLI.prototype.runApplication = function(name, ref, options) {
  ref = ref || 'master'

  this._do(options, function(boss) {
    boss.switchApplicationRef(name, ref, function(info) {
      console.info(info)
    }, function(err) {
      console.error(err)
    }, function(error, applicationInfo) {
      if(error) throw error

      options.name = name

      this.start(applicationInfo.path, options)
    }.bind(this))
  }.bind(this))
}

CLI.prototype.unknown = function() {
  this._logger.error('Please specify a known subcommand. See \'' + commander.name() + ' --help\' for commands.')
}

CLI.prototype._do = function(options, callback) {
  this._setLoggingLevel(options)

  this._connect(function(error, boss) {
    if(error) throw error
    this._logBossMessages(boss)

    callback(boss)
  }.bind(this))
}

CLI.prototype._doAdmin = function(operation, options, callback) {
  this._setLoggingLevel(options)

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

CLI.prototype._setLoggingLevel = function(options) {
  if(options && options.verbose) {
    this._logger.transports.console.level = 'debug'
  }

  this._logger.debug('Loaded config from', this._config._rcfiles)
}

CLI.prototype._logBossMessages = function(boss) {
  // log any messages from the boss daemon
  boss.on('boss:log:info', function() {
    this._logger.info.apply(this._logger, ['boss:log:info'].concat(Array.prototype.slice.call(arguments)))
  }.bind(this))
  boss.on('boss:log:warn', function() {
    this._logger.warn.apply(this._logger, ['boss:log:warn'].concat(Array.prototype.slice.call(arguments)))
  }.bind(this))
  boss.on('boss:log:error', function() {
    this._logger.error.apply(this._logger, ['boss:log:error'].concat(Array.prototype.slice.call(arguments)))
  }.bind(this))
  boss.on('boss:log:debug', function() {
    this._logger.debug.apply(this._logger, ['boss:log:debug'].concat(Array.prototype.slice.call(arguments)))
  }.bind(this))
}

CLI.prototype._withRemoteProcess = function(boss, pid, callback) {
  this._logger.debug('Connected, finding process info for pid %d', pid)

  boss.findProcessInfoByPid(pid, function(error, processInfo) {
    if (error) throw error

    if(!processInfo) {
      this._logger.error('No process exists for pid %d', pid)
      process.exit(1)
    }

    boss.connectToProcess(processInfo.id, function(error, remote) {
      if(error) {
        if(error.code == 'EACCES') {
          return this._logger.error('I don\'t have permission to access the process - please run boss as a user that can.')
        }

        if(error.code == 'ENOENT') {
          return this._logger.error('No process was found with pid', pid)
        }

        if(error.code == 'ECONNREFUSED') {
          return this._logger.error('Connection to remote process was refused')
        }
      }

      if(!remote) {
        this._logger.error('Process id', pid, 'is invalid')
        process.exit(1)
      }

      callback(error, remote, processInfo)
    }.bind(this))
  }.bind(this))
}

module.exports = CLI
