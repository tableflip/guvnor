var Container = require('wantsit').Container,
  path = require('path'),
  winston = require('winston'),
  stackup = require('stackup')

var config = require('rc')('boss')
var container = new Container()
var fileSystem = container.createAndRegister('fileSystem', require('./lib/common/FileSystem'))
fileSystem.findLogFile('boss.log', function(error, logFile) {
  if(error) throw error

  container.register('logger', new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true
      }),
      new winston.transports.DailyRotateFile({
        filename: logFile
      })
    ]
  }))
  container.register('config', config)
  container.createAndRegister('remoteProcess', require('./lib/boss/RemoteProcess'))
  container.createAndRegister('boss', require('./lib/boss/Boss'))
  container.createAndRegister('bossRpc', require('./lib/boss/BossRPC'))
})

process.on('uncaughtException', function(error) {
  container.find('logger').error('uncaughtException ' + error)

  process.exit(1)
})
