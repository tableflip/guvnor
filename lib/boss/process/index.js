require('stackup')
require('heapdump')

var Container = require('wantsit').Container,
  path = require('path'),
  RemoteProcessLogger = require('../common/RemoteProcessLogger'),
  winston = require('winston')

var container = new Container()
container.register('config', require('rc')('boss', path.resolve(__dirname, '../../../bossrc')))
container.register('logger', new winston.Logger({
  transports: [
    new RemoteProcessLogger()
  ]
}))
container.register('dnode', require('dnode'))
container.register('usage', require('usage'))
container.register('posix', require('posix'))
container.register('fs', require('fs'))
container.createAndRegister('fileSystem', require('../../common/FileSystem'))
container.createAndRegister('parentProcess', require('../common/ParentProcess'))
container.createAndRegister('exceptionHandler', require('../common/ExceptionHandler'))
container.createAndRegister('messageHandler', require('./MessageHandler'))
container.createAndRegister('logRedirector', require('../common/LogRedirector'))
container.createAndRegister('userInfo', require('../common/UserInfo'))
container.createAndRegister('killSwitch', require('../common/KillSwitch'))
container.createAndRegister('processWrapper', require('./ProcessWrapper'))
