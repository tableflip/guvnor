var Container = require('wantsit').Container,
  winston = require('winston'),
  path = require('path')

var container = new Container()
container.register('config', require('rc')('boss', path.resolve(__dirname, '.bossrc')))
container.register('logger', new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: 'warn'
    })
  ]
}))
container.createAndRegister('cli', require('./lib/cli/CLI'))
container.createAndRegister('boss', require('./lib/cli/BossDaemonStarter'))
container.createAndRegister('fileSystem', require('./lib/common/FileSystem'))

process.on('uncaughtException', function(error) {
  container.find('logger').error('uncaughtException ' + error)

  process.exit(1)
})
