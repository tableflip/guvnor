var Container = require('wantsit').Container,
  path = require('path'),
  winston = require('winston')

var config = require('rc')('boss', path.resolve(__dirname, '.bossrc'))

var container = new Container()
container.register('config', config)
container.register('logger', new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
}))
container.createAndRegister('boss', require('./lib/BossRPC'))
