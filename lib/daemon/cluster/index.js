var Container = require('wantsit').Container
var ObjectFactory = require('wantsit').ObjectFactory
var winston = require('winston')

var container = new Container({
  timeout: 0
})
container.register('dnode', require('boss-dnode'))
container.register('usage', require('usage'))
container.register('posix', require('posix'))
container.register('fs', require('fs'))
container.register('os', require('os'))
container.register('mkdirp', require('mkdirp'))
container.register('freeport', require('freeport'))
container.register('heapdump', require('heapdump'))
container.register('cluster', require('cluster'))
container.register('coercer', require('coercer'))
container.register('child_process', require('child_process'))
container.register('lag', require('event-loop-lag'))
container.register('logger', new winston.Logger())
container.createAndRegister('remoteProcessLogger', require('../common/RemoteProcessLogger'), [{
  name: 'remote'
}], function (error, logger) {
  if (!error) {
    container.find('logger').add(logger, null, true)
  }
})
container.createAndRegister('consoleDebugLogger', require('../common/ConsoleDebugLogger'), [{
  name: 'console',
  colorize: true
}], function (error, logger) {
  if (!error) {
    container.find('logger').add(logger, null, true)
  }
})
container.createAndRegister('parentProcess', require('../common/ParentProcess'))
container.createAndRegister('config', require('../common/ConfigLoader'))
container.createAndRegister('logRedirector', require('../common/LogRedirector'))
container.createAndRegister('managedProcessFactory', ObjectFactory, [require('../../common/ManagedProcess')])
container.createAndRegister('exceptionHandler', require('../common/ExceptionHandler'))
container.createAndRegister('fileSystem', require('../util/FileSystem'))
container.createAndRegister('userInfo', require('../common/UserInfo'))
container.createAndRegister('processRpc', require('./ClusterManagerRPC'))
container.createAndRegister('processInfoFactory', ObjectFactory, [require('../domain/ProcessInfo')])
container.createAndRegister('processInfoStore', require('../domain/Store'), ['processInfoFactory'])
container.createAndRegister('processService', require('./ClusterProcessService'))
container.createAndRegister('clusterProcessWrapper', require('./ClusterProcessWrapper'))
container.createAndRegister('clusterManager', require('./ClusterManager'))
container.createAndRegister('latencyMonitor', require('../common/LatencyMonitor'))
