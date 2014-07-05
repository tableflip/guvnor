var cluster = require('cluster')

if(cluster.isWorker) {
  return require('./../process/index')
}

require('stackup')
require('heapdump')

var Container = require('wantsit').Container,
  path = require('path'),
  RemoteProcessLogger = require('../RemoteProcessLogger'),
  winston = require('winston')

var container = new Container()
container.register('config', require('rc')('boss', path.resolve(__dirname, '../../../bossrc')))
container.register('logger', new winston.Logger({
  transports: [
    new RemoteProcessLogger()
  ]
}))
container.createAndRegister('fileSystem', require('../../common/FileSystem'))
container.createAndRegister('parentProcess', require('../ParentProcess'))
container.createAndRegister('exceptionHandler', require('./ExceptionHandler'))
container.createAndRegister('messageHandler', require('./MessageHandler'))
container.createAndRegister('logRedirector', require('./LogRedirector'))
container.createAndRegister('userInfo', require('./UserInfo'))
container.createAndRegister('killSwitch', require('./KillSwitch'))
container.createAndRegister('clusterManager', require('./ClusterManager'))
