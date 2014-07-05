require('stackup')

var Container = require('wantsit').Container,
  path = require('path'),
  winston = require('winston')

var container = new Container()
container.register('config', require('rc')('boss', path.resolve(__dirname, 'bossrc')))
container.register('fs', require('fs'))
container.createAndRegister('fileSystem', require('./lib/common/FileSystem')).findOrCreateLogFileDirectory(function(error, logFileDirectory) {
  if(error) throw error

  container.register('logger', new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true
      }),
      new winston.transports.DailyRotateFile({
        filename: logFileDirectory + '/boss.log'
      })
    ]
  }))
  container.createAndRegister('parentProcess', require('./lib/boss/ParentProcess'))
  container.createAndRegister('boss', require('./lib/boss/Boss'))
  container.createAndRegister('bossRpc', require('./lib/boss/BossRPC'))
})

process.on('uncaughtException', function(error) {
  var message = error

  if(error.stack) {
    message = error.stack
  }

  container.find('parentProcess').send({type: 'daemon:fatality', message: message})

  process.exit(1)
})
