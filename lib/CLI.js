var path = require('path'),
  Autowire = require('wantsit').Autowire

var CLI = function() {
  this._connect = Autowire
  this._running = Autowire
  this._logger = Autowire
  this._config = Autowire
  this._posix = Autowire
  this._commander = Autowire
  this._package = Autowire

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

  this._checkUserPermissions()

  this._commander
    .version(this._package.version)

  this._commander
    .command('list')
      .description('List all running processes')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.list.bind(this._processes))

  this._commander
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
      .action(this._processes.start.bind(this._processes))

  this._commander
    .command('cluster <pid> <workers>')
      .description('Set the number of workers managed by the cluster manager with the passed pid')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._cluster.setClusterWorkers.bind(this._cluster))

  this._commander
    .command('stop <pid>')
      .description('Stop a process')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.stop.bind(this._processes))

  this._commander
    .command('restart <pid>')
    .description('Restart a process')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.restart.bind(this._processes))

  this._commander
    .command('send <pid> <event> [args...]')
      .description('Causes process.emit(event, args[0], args[1]...) to occur in the process')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.send.bind(this._processes))

  this._commander
    .command('heapdump <pid>')
      .description('Write out a snapshot of the processes memory for inspection')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._processes.heapdump.bind(this._processes))

  this._commander
    .command('gc <pid>')
    .description('Force garbage collection to occur in the process with the passed pid')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.gc.bind(this._processes))

  this._commander
    .command('signal <pid> <signal>')
    .description('Sends a signal to a process (SIGUSR1, SIGINT, SIGHUP, SIGTERM, etc)')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._processes.signal.bind(this._processes))

  this._commander
    .command('logs [pid]')
      .description('Show realtime process logs, optionally filtering by pid')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._daemon.logs.bind(this._daemon))

  this._commander
    .command('kill')
    .description('Stop all processes and kill the daemon')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._daemon.kill.bind(this._daemon))

  this._commander
    .command('dump')
      .description('Dumps process data to ' + this._config.boss.confdir + '/processes.json')
      .option('-v, --verbose', 'Prints detailed internal logging output')
      .action(this._daemon.dump.bind(this._daemon))

  this._commander
    .command('restore')
      .description('Restores processes from ' + this._config.boss.confdir + '/processes.json')
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
    .description('Prints the remote host config for boss-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.remoteHostConfig.bind(this._remote))

  this._commander
    .command('useradd <username> [hostname]')
    .description('Adds a user for use with boss-web')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.addRemoteUser.bind(this._remote))

  this._commander
    .command('rmuser <username>')
    .description('Removes a user from the boss-web user list')
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
    .description('Generates self-signed SSL certificates for use between boss and boss-web that will expire in the passed number of days (defaults to 365)')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._remote.generateSSLCertificate.bind(this._remote))

  this._commander
    .command('deploy <name> <url>')
    .description('Deploys an application from a git repository')
    .option('-u, --user <user>', 'The user to deploy as - n.b. the current user must be able to su to that user')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.deployApplication.bind(this._apps))

  this._commander
    .command('lsapps')
    .description('List applications that have been deployed from git repositories')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.listApplications.bind(this._apps))

  this._commander
    .command('rmapp <name>')
    .description('Remote deployed application')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.removeApplication.bind(this._apps))

  this._commander
    .command('startapp <name> [ref]')
    .description('Start a deployed application')
    .option('-u, --user <user>', 'The user to start a process as')
    .option('-g, --group <group>', 'The group to start a process as')
    .option('-i, --instances <instances>', 'How many instances of the process to start', parseInt)
    .option('-a, --argv <argv>', 'A space separated list of arguments to pass to a process', this._parseList, [])
    .option('-e, --execArgv <execArgv>', 'A space separated list of arguments to pass to the node executable', this._parseList, [])
    .option('-d, --debug', 'Pause the process at the start of execution and wait for a debugger to be attached')
    .option('-v, --verbose', 'Prints detailed internal logging output')
    .action(this._apps.runApplication.bind(this._apps))

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

CLI.prototype._checkUserPermissions = function() {
  // check that we're in the right group
  if(this._user.name != this._config.boss.user) {
    var bossGroup = this._posix.getgrnam(this._config.boss.group)

    if(bossGroup.members.indexOf(this._user.name) == -1) {
      this._logger.warn('Boss has been configured to run as the', this._config.boss.group, 'group but you are not a member - you may experience permissions errors')
      this._logger.warn('To fix this, either become a member of that group or change the ${boss.group} setting in %s/bossrc', this._config.boss.confdir)
      this._logger.warn('If you change the ${boss.group} setting you will need to chgrp -R %s, %s, %s and %s', this._config.boss.confdir, this._config.boss.rundir, this._config.boss.logdir, this._config.boss.appdir)
    }
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

CLI.prototype.unknown = function() {
  this._logger.error('Please specify a known subcommand. See \'' + this._commander.name() + ' --help\' for commands.')
}

module.exports = CLI
