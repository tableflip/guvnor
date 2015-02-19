var path = require('path'),
  Autowire = require('wantsit').Autowire,
  async = require('async'),
  splitargs = require('splitargs')

var CLI = function() {
  this._connect = Autowire
  this._running = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._posix = Autowire
  this._commander = Autowire
  this._package = Autowire
  this._execSync = Autowire
  this._prompt = Autowire
  this._running = Autowire
  this._fs = Autowire
  this._os = Autowire
  this._child_process = Autowire
  this._apps = Autowire
  this._cluster = Autowire
  this._daemon = Autowire
  this._processes = Autowire
  this._remote = Autowire

  this._user = Autowire
  this._group = Autowire
}

CLI.prototype.afterPropertiesSet = function() {
  this._logger.debug('Loaded config from', this._config._rcfiles)

  async.series([
    this._checkGuvnorUser.bind(this),
    this._checkGuvnorGroup.bind(this)
  ], function(error) {
    if(error) throw error

    this._setUpCommander()
  }.bind(this))
}

CLI.prototype._setUpCommander = function() {

  this._commander
    .version(this._package.version)

  this._commander
    .command('list')
      .description('List all running processes')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.list.bind(this._processes))

  this._commander
    .command('start <scriptOrAppName>')
      .description('Start a process')
      .option('-u, --user <user>', 'The user to start a process as')
      .option('-g, --group <group>', 'The group to start a process as')
      .option('-i, --instances <instances>', 'How many instances of the process to start', parseInt)
      .option('-n, --name <name>', 'What name to give the process. If omitted and there is a package.json in the same directory as your script, it will be loaded and the name property used automatically.')
      .option('-a, --argv <argv>', 'A space separated list of arguments to pass to a process', splitargs, [])
      .option('-e, --execArgv <execArgv>', 'A space separated list of arguments to pass to the node executable', splitargs, [])
      .option('-d, --debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.start.bind(this._processes))

  this._commander
    .command('workers <pidOrName> <workers>')
      .description('Set the number of workers managed by the cluster manager with the passed pid/name')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._cluster.setClusterWorkers.bind(this._cluster))

  this._commander
    .command('stop <pidOrName...>')
      .description('Stop one or more processes')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.stop.bind(this._processes))

  this._commander
    .command('remove <pidOrName...>')
    .description('Remove one or more processes')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.remove.bind(this._processes))

  this._commander
    .command('restart <pidOrName...>')
    .description('Restart one or more processes')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.restart.bind(this._processes))

  this._commander
    .command('send <pidOrName> <event> [args...]')
      .description('Causes process.emit(event, args[0], args[1]...) to occur in the process')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.send.bind(this._processes))

  this._commander
    .command('heapdump <pidOrName>')
      .description('Write out a snapshot of the processes memory for inspection')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.heapdump.bind(this._processes))

  this._commander
    .command('gc <pidOrName>')
    .description('Force garbage collection to occur in the process with the passed pid/name')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.gc.bind(this._processes))

  this._commander
    .command('signal <pidOrName> <signal>')
    .description('Sends a signal to a process (SIGUSR1, SIGINT, SIGHUP, SIGTERM, etc)')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.signal.bind(this._processes))

  this._commander
    .command('logs [pidOrName]')
      .description('Show realtime process logs, optionally filtering by pid/name')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._daemon.logs.bind(this._daemon))

  this._commander
    .command('kill')
    .description('Stop all processes and kill the daemon')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._daemon.kill.bind(this._daemon))

  this._commander
    .command('dump')
      .description('Dumps process data to ' + this._config.guvnor.confdir + '/processes.json')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._daemon.dump.bind(this._daemon))

  this._commander
    .command('restore')
      .description('Restores processes from ' + this._config.guvnor.confdir + '/processes.json')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._daemon.restore.bind(this._daemon))

  this._commander
    .command('config <path>')
    .description('Print a config option')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._daemon.config.bind(this._daemon))

  this._commander
    .command('status')
    .description('Returns whether the daemon is running or not')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._daemon.status.bind(this._daemon))

  this._commander
    .command('remoteconfig [hostname]')
    .description('Prints the remote host config for guvnor-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.remoteHostConfig.bind(this._remote))

  this._commander
    .command('useradd <username>')
    .description('Adds a user for use with guvnor-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.addRemoteUser.bind(this._remote))

  this._commander
    .command('rmuser <username>')
    .description('Removes a user from the guvnor-web user list')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.deleteRemoteUser.bind(this._remote))

  this._commander
    .command('lsusers')
    .description('Prints out all remote users')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.listRemoteUsers.bind(this._remote))

  this._commander
    .command('reset <username>')
    .description('Generate a new secret for the passed user')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.rotateRemoteUserKeys.bind(this._remote))

  this._commander
    .command('genssl [days]')
    .description('Generates self-signed SSL certificates for use between guvnor and guvnor-web that will expire in the passed number of days (defaults to 365)')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.generateSSLCertificate.bind(this._remote))

  this._commander
    .command('install <url> [appName]')
    .description('Installs an application from a git repository')
    .option('-u, --user <user>', 'The user to install as - n.b. the current user must be able to su to that user')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.installApplication.bind(this._apps))

  this._commander
    .command('lsapps')
    .description('List applications that have been deployed from git repositories')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.listApplications.bind(this._apps))

  this._commander
    .command('rmapp <appName>')
    .description('Remote deployed application')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.removeApplication.bind(this._apps))

  this._commander
    .command('lsrefs <appName>')
    .description('Lists app refs available to be started')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.listRefs.bind(this._apps))

  this._commander
    .command('updaterefs <appName>')
    .description('Updates app refs available to be started')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.updateRefs.bind(this._apps))

  this._commander
    .command('setref <appName> <ref>')
    .description('Checks out the app at the passed ref')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.setRef.bind(this._apps))

  this._commander
    .command('web')
    .description('Starts guvnor-web as a managed process')
    .option('-u, --user <user>', 'The user to start a process as')
    .option('-g, --group <group>', 'The group to start a process as')
    .option('-d, --debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.startWebMonitor.bind(this._processes))

  this._commander
    .command('*')
    .description('')
    .action(this.unknown.bind(this))

  var program = this._commander.parse(process.argv)

  // No command
  if(program.rawArgs.length == 2) {
    this._processes.list()
  }
}

CLI.prototype._checkGuvnorUser = function(callback) {
  if(this._user.name == this._config.guvnor.user) {
    return callback()
  }

  var guvnorGroup

  try {
    guvnorGroup = this._posix.getgrnam(this._config.guvnor.group)
  } catch(e) {
    if(e.message != 'group id does not exist') {
      return callback(e)
    }

    this._logger.error('Guvnor has been configured to run as %s:%s but the %s group does not exist.', this._config.guvnor.user, this._config.guvnor.group, this._config.guvnor.group)
    this._logger.error('')
    this._logger.error('To fix this run guvnor as %s and it will attempt to create the %s group.', this._config.guvnor.user, this._config.guvnor.group)
    this._logger.error('')

    return callback(new Error(this._config.guvnor.group + ' group does not exist'))
  }

  if(guvnorGroup.members.indexOf(this._user.name) == -1) {
    this._logger.error('Guvnor has been configured to run as %s:%s but user %s is not in the group %s', this._config.guvnor.user, this._config.guvnor.group , this._user.name, this._config.guvnor.group)
    this._logger.error('')

    if(this._os.platform() == 'linux') {
      this._logger.error('To fix this run:')
      this._logger.error('')
      this._logger.error('$ sudo usermod -G %s -a %s', this._config.guvnor.group, this._user.name)
      this._logger.error('')
    } else if(this._os.platform() == 'darwin') {
      this._logger.error('To fix this run:')
      this._logger.error('')
      this._logger.error('$ sudo dscl . append /Groups/%s GroupMembership %s', this._config.guvnor.group, this._user.name)
      this._logger.error('')
    } else {
      this._logger.error('To fix this add % to the % group.', this._user.name, this._config.guvnor.group)
      this._logger.error('')
    }

    this._logger.error('Note you may need to log out and in again for the new group membership to take effect.')
    this._logger.error('')

    return callback(new Error('User is in the wrong group'))
  }

  this._running(function(running) {
    callback(running ? undefined : new Error('The daemon is not running. Please run this command as ' + this._config.guvnor.user + ' to start the daemon.'))
  }.bind(this))
}

CLI.prototype._checkGuvnorGroup = function(callback) {
  try {
    this._posix.getgrnam(this._config.guvnor.group)

    return callback()
  } catch(error) {
    if(error.message == 'group id does not exist') {

      this._logger.warn('Guvnor has been configured to start with the group \'%s\' but that group does not exist', this._config.guvnor.group)
      this._prompt.start()
      this._prompt.get([{
        name: 'create group \'' + this._config.guvnor.group + '\' [Y/n]',
        default: 'Y'
      }], function (error) {
        if(error) return callback(error)

        this._logger.debug('Creating group', this._config.guvnor.group)

        // ugh http://www.greenend.org.uk/rjk/tech/useradd.html

        var command

        // linux
        try {
          command = this._execSync('which groupadd').toString().trim()
        } catch(e) {
          this._logger.debug('which groupadd failed')
        }

        if(command) {
          this._logger.debug('using groupadd', command)

          command = command.toString() + ' ' + this._config.guvnor.group

          this._logger.debug(command)

          try {
            this._execSync(command)
          } catch(e) {
            error = new Error('Automatically creating group ' + this._config.guvnor.group + ' failed, please create it manually')
          }

          return callback(error)
        }

        // mac os x
        try {
          command = this._execSync('which dscl').toString().trim()
        } catch(e) {
          this._logger.debug('which dscl failed')
        }

        if(command) {
          this._logger.debug('using dscl', command)

          // gids over 500 will appear in the system preferences window
          var gid = 500

          async.series([
            function(callback) {
              this._child_process.exec(command + ' . -list /Groups PrimaryGroupID', function(error, stdout) {
                if(error) return callback(error)

                stdout.trim().split('\n').forEach(function(line) {
                  line = line.replace(/\s+/g, ' ')
                  var parts = line.split(' ')

                  var existingGid = parseInt(parts[1], 10)

                  if(gid == existingGid) {
                    gid = existingGid + 1
                  }
                })

                this._logger.debug(this._config.guvnor.group + ' will have gid ' + gid)

                callback()
              }.bind(this))
            }.bind(this),
            function(callback) {
              this._child_process.exec(command + ' . create /Groups/' + this._config.guvnor.group, callback)
            }.bind(this),
            function(callback) {
              this._child_process.exec(command + ' . create /Groups/' + this._config.guvnor.group + ' name ' + this._config.guvnor.group, callback)
            }.bind(this),
            function(callback) {
              this._child_process.exec(command + ' . create /Groups/' + this._config.guvnor.group + ' passwd "*"', callback)
            }.bind(this),
            function(callback) {
              this._child_process.exec(command + ' . create /Groups/' + this._config.guvnor.group + ' gid ' + gid, callback)
            }.bind(this),
            function(callback) {
              this._fs.appendFile('/etc/group', this._config.guvnor.group + ':*:' + gid + ':\n', callback)
            }.bind(this)
          ], callback)

          return
        }

        callback(new Error('Automatically creating group ' + this._config.guvnor.group + ' failed, please create it manually'))
      }.bind(this))
    } else {
      callback(error)
    }
  }
}

CLI.prototype.unknown = function() {
  this._logger.error('Please specify a known subcommand. See \'' + this._commander.name() + ' --help\' for commands.')
}

module.exports = CLI
