var cluster = require('cluster')

if(cluster.isWorker) {
  return require('../process')
}

require('stackup')
require('heapdump')

var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory,
  path = require('path'),
  winston = require('winston')

var container = new Container()
container.register('dnode', require('dnode'))
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
container.register('execSync', require('execSync'))
container.register('logger', new winston.Logger())
container.createAndRegister('remoteProcessLogger', require('../common/RemoteProcessLogger'), [{
  name: 'remote'
}], function(error, logger) {
  container.find('logger').add(logger, null, true)
})
container.createAndRegister('consoleDebugLogger', require('../common/ConsoleDebugLogger'), [{
  name: 'console',
  colorize: true
}], function(error, logger) {
  container.find('logger').add(logger, null, true)
})
container.createAndRegister('parentProcess', require('../common/ParentProcess'))
container.createAndRegister('config', require('../common/ConfigLoader'))
container.createAndRegister('logRedirector', require('../common/LogRedirector'))
container.createAndRegister('processFactory', ObjectFactory, [require('../../common/Process')])
container.createAndRegister('exceptionHandler', require('../common/ExceptionHandler'))
container.createAndRegister('fileSystem', require('../util/FileSystem'))
container.createAndRegister('userInfo', require('../common/UserInfo'))
container.createAndRegister('processRpc', require('./ClusterManagerRPC'))
container.createAndRegister('processInfoFactory', ObjectFactory, [require('../domain/ProcessInfo')])
container.createAndRegister('processInfoStore', require('../domain/Store'), ['processInfoFactory'])
container.createAndRegister('processService', require('./ClusterProcessService'))
container.createAndRegister('clusterProcessWrapper', require('./ClusterProcessWrapper'))
container.createAndRegister('clusterManager', require('./ClusterManager'))
