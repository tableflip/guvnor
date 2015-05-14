var Container = require('wantsit').Container
var ObjectFactory = require('wantsit').ObjectFactory

function createContainer (callback) {
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
  container.createAndRegister('processStore', require('../common/Store'), ['managedProcessFactory'])
  container.createAndRegister('managedAppFactory', ObjectFactory, [require('../common/ManagedApp')])
  container.createAndRegister('appStore', require('../common/Store'), ['managedAppFactory'])
  container.createAndRegister('localDaemonAdminConnection', require('./LocalDaemonConnection'), ['admin.socket'])
  container.createAndRegister('localDaemonUserConnection', require('./LocalDaemonConnection'), ['user.socket'])
  container.createAndRegister('localDaemonStarter', require('./LocalDaemonStarter'))
  container.createAndRegister('localDaemon', require('./LocalDaemon'))

  container.once('ready', callback)
}

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

function findConfigAndLogger (container, args) {
  var logger = findLogger.apply(null, args)
  container.setLogger(logger)

  container.register('config', findConfig.apply(null, args))
  container.register('logger', logger)
}

module.exports = {
  connect: function () {
    var args = Array.prototype.slice.call(arguments)

    createContainer(function (container) {
      findConfigAndLogger(container, args)

      container.find('localDaemon').connect(args[args.length - 1])
    })
  },
  connectOrStart: function () {
    var args = Array.prototype.slice.call(arguments)

    createContainer(function (container) {
      findConfigAndLogger(container, args)

      container.find('localDaemon').connectOrStart(args[args.length - 1])
    })
  },
  running: require('./is-daemon-running'),
  stopDaemon: require('./stop-daemon')
}
