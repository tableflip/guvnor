var Container = require('wantsit').Container
var ObjectFactory = require('wantsit').ObjectFactory
var winston = require('winston')

var container = new Container({
  timeout: 0
})
container.on('error', function (error) {
  console.warn('Container error:', error.message || error.message.stack)
})
container.register('fs', require('fs'))
container.register('os', require('os'))
container.register('mkdirp', require('mkdirp'))
container.register('posix', require('posix'))
container.register('dnode', require('boss-dnode'))
container.register('freeport', require('freeport'))
container.register('pem', require('pem'))
container.register('tls', require('tls'))
container.register('usage', require('usage'))
container.register('cpuStats', require('cpu-stats'))
container.register('jsonfile', require('jsonfile'))
container.register('child_process', require('child_process'))
container.register('package', require('../../package'))
container.register('rimraf', require('rimraf'))
container.register('coercer', require('coercer'))
container.register('ini', require('ini'))
container.register('etc_passwd', require('etc-passwd'))
container.register('semver', require('semver'))
container.register('logger', new winston.Logger({
  handleExceptions: true,
  exitOnError: function (error) {
    error = error || {}

    if (error.code === 'EPIPE') {
      // sometimes clients go away
      return false
    }

    console.error(error.stack ? error.stack : error)

    try {
      container.find('nodeInspectorWrapper').stopNodeInspector()
    } catch (e) {
      console.error(e)
    }

    try {
      container.find('processService').killAll()
    } catch (e) {
      console.error(e)
    }

    var normalisedError = {
      message: error.message || (error.stack ? error.stack.toString().split('\n')[0] : 'No message'),
      code: error.code,
      stack: error.stack
    }

    try {
      container.find('userRpc').broadcast('daemon:fatality', normalisedError)
    } catch (e) {
      console.error(e)
    }

    try {
      container.find('parentProcess').send('daemon:fatality', normalisedError)
    } catch (e) {
      console.error(e)
    }

    return true
  }
}))
container.createAndRegister('remoteUserObjectFactory', ObjectFactory, [require('./domain/RemoteUser')])
container.createAndRegister('remoteUserStore', require('./domain/PersistentStore'), ['remoteUserObjectFactory', 'users.json'])
container.createAndRegister('applicationObjectFactory', ObjectFactory, [require('./domain/AppInfo')])
container.createAndRegister('applicationStore', require('./domain/PersistentStore'), ['applicationObjectFactory', 'apps.json'])
container.createAndRegister('processInfoObjectFactory', ObjectFactory, [require('./domain/ProcessInfo')])
container.createAndRegister('processInfoStore', require('./domain/PersistentStore'), ['processInfoObjectFactory', 'processes.json'])
container.createAndRegister('userDetailsFactory', ObjectFactory, [require('./domain/UserDetails')])
container.createAndRegister('parentProcess', require('./common/ParentProcess'))
container.createAndRegister('config', require('./common/ConfigLoader'), ['daemon'])
container.createAndRegister('fileSystem', require('./util/FileSystem'))
container.createAndRegister('daemonLogger', require('./DaemonLogger'))
container.createAndRegister('logAdder', require('./util/LogAdder'))
container.createAndRegister('processInfoFactory', ObjectFactory, [require('./domain/ProcessInfo')])
container.createAndRegister('processInfoStoreFactory', ObjectFactory, [require('./domain/PersistentStore')])
container.createAndRegister('commandLine', require('./util/CommandLine'))
container.createAndRegister('crypto', require('../common/Crypto'))
container.createAndRegister('processService', require('./service/ProcessService'))
container.createAndRegister('managedProcessFactory', ObjectFactory, [require('../common/ManagedProcess')])
container.createAndRegister('adminRpc', require('./rpc/AdminRPC'))
container.createAndRegister('userRpc', require('./rpc/UserRPC'))
container.createAndRegister('remoteRpc', require('./rpc/RemoteRPC'))
container.createAndRegister('nodeInspectorWrapper', require('./inspector/NodeInspectorWrapper'))
container.createAndRegister('appService', require('./service/AppService'))
container.createAndRegister('remoteUserService', require('./service/RemoteUserService'))
container.createAndRegister('startupNotifier', require('./StartupNotifier'))
container.createAndRegister('guvnor', require('./Guvnor'))

// optional dependency, don't care if it fails
try {
  container.register('mdns', require('mdns'))
} catch (e) {
  container.find('logger').info('Failed to register mdns component.')

  if (process.platform === 'linux') {
    container.find('logger').info('Please run `$ sudo apt-get install libavahi-compat-libdnssd-dev` before installing guvnor.')
  }

  container.find('logger').info(e.stack)
}
