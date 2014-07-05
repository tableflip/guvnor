require('stackup')

var Container = require('wantsit').Container,
  winston = require('winston'),
  path = require('path')

var container = new Container()
container.register('config', require('rc')('boss', path.resolve(__dirname, 'bossrc')))
container.register('logger', new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: 'warn'
    })
  ]
}))
container.createAndRegister('boss', require('./lib/cli/BossDaemonStarter'))
container.createAndRegister('fileSystem', require('./lib/common/FileSystem'))
container.createAndRegister('remoteProcessFactory', require('./lib/cli/RemoteProcessFactory'))
container.createAndRegister('cli', require('./lib/cli/CLI'))

process.on('uncaughtException', function(error) {
  var logger = container.find('logger')

  if(error && error.stack) {
    logger.error(error.stack)
  } else {
    logger.error('Uncaught exception: ' + error)
  }

  process.exit(1)
})
