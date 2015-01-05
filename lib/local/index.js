var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory

var container = new Container()
container.register('logger', {})
container.register('config', {})
container.register('fs', require('fs'))
container.register('mkdirp', require('mkdirp'))
container.register('posix', require('posix'))
container.register('dnode', require('dnode'))
container.register('freeport', require('freeport'))
container.register('child_process', require('child_process'))
container.register('semver', require('semver'))
container.createAndRegister('processFactory', ObjectFactory, [require('../common/Process')])
container.createAndRegister('localDaemonAdminConnection', require('./LocalDaemonConnection'), ['admin.socket'])
container.createAndRegister('localDaemonUserConnection', require('./LocalDaemonConnection'), ['user.socket'])
container.createAndRegister('localDaemonStarter', require('./LocalDaemonStarter'))
container.createAndRegister('localDaemon', require('./LocalDaemon'))

function findConfig() {
  for(var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if(arg.boss && arg.boss.rundir && arg.boss.logdir) {
      return arg
    }
  }

  throw new Error('No config object found')
}

function findLogger() {
  for(var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if(arg.info && arg.warn && arg.error && arg.debug) {
      return arg
    }
  }

  return {
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: function() {}
  }
}

module.exports = {
  connect: function() {
    var logger = findLogger.apply(null, arguments)
    container.setLogger(logger)

    container.register('config', findConfig.apply(null, arguments))
    container.register('logger', logger)

    container.find('localDaemon').connectOrStart(arguments[arguments.length - 1])
  },
  running: function() {
    var logger = findLogger.apply(null, arguments)
    container.setLogger(logger)

    container.register('config', findConfig.apply(null, arguments))
    container.register('logger', logger)

    var callback = arguments[arguments.length - 1]

    var connection = container.find('localDaemonUserConnection')
    connection.connect({}, function(error) {
      if(error && error.code == 'DAEMON_NOT_RUNNING') {
        return process.nextTick(callback.bind(callback, false))
      }

      process.nextTick(callback.bind(callback, true))

      connection.disconnect()
    })
  }
}
