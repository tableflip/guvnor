var Container = require('wantsit').Container
var ObjectFactory = require('wantsit').ObjectFactory

var container = new Container()
container.register('logger', {})
container.register('config', {})
container.register('fs', require('fs'))
container.register('mkdirp', require('mkdirp'))
container.register('posix', require('posix'))
container.register('dnode', require('boss-dnode'))
container.register('freeport', require('freeport'))
container.register('child_process', require('child_process'))
container.register('semver', require('semver'))
container.createAndRegister('managedProcessFactory', ObjectFactory, [require('../common/ManagedProcess')])
container.createAndRegister('localDaemonAdminConnection', require('./LocalDaemonConnection'), ['admin.socket'])
container.createAndRegister('localDaemonUserConnection', require('./LocalDaemonConnection'), ['user.socket'])
container.createAndRegister('localDaemonStarter', require('./LocalDaemonStarter'))
container.createAndRegister('localDaemon', require('./LocalDaemon'))

function findConfig () {
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if (arg.guvnor && arg.guvnor.rundir && arg.guvnor.logdir) {
      return arg
    }
  }

  // load default config
  return require('rc')('guvnor/guvnor', require('path').resolve(__dirname, '../../guvnor'))
}

function findLogger () {
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if (arg.info && arg.warn && arg.error && arg.debug) {
      return arg
    }
  }

  return {
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: function () {}
  }
}

function findConfigAndLogger () {
  var logger = findLogger.apply(null, arguments)
  container.setLogger(logger)

  container.register('config', findConfig.apply(null, arguments))
  container.register('logger', logger)
}

module.exports = {
  connect: function () {
    findConfigAndLogger.apply(null, arguments)

    container.find('localDaemon').connect(arguments[arguments.length - 1])
  },
  connectOrStart: function () {
    findConfigAndLogger.apply(null, arguments)

    container.find('localDaemon').connectOrStart(arguments[arguments.length - 1])
  },
  running: function () {
    findConfigAndLogger.apply(null, arguments)

    var callback = arguments[arguments.length - 1]

    var connection = container.find('localDaemonUserConnection')
    connection.connect({}, function (error) {
      if (error && error.code === 'DAEMON_NOT_RUNNING') {
        return process.nextTick(callback.bind(callback, false))
      }

      process.nextTick(callback.bind(callback, true))

      connection.disconnect()
    })
  }
}
