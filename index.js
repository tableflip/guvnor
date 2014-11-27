require('stackup')

var Container = require('wantsit').Container,
  winston = require('winston'),
  path = require('path'),
  connect = require('boss-local').connect,
  running = require('boss-local').running

var logLevel = (process.argv.indexOf('--verbose') != -1  || process.argv.indexOf('-v') != -1) ? 'debug': 'warn'

var container = new Container()
container.register('config', require('boss-rc')('boss/boss', path.resolve(__dirname, 'bossrc')))
container.register('logger', new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: logLevel
    })
  ]
}))
container.register('connect', connect.bind(null, container.find('config'), container.find('logger')))
container.register('running', running.bind(null, container.find('config'), container.find('logger')))
container.createAndRegister('cli', require('./lib/CLI'))

process.on('uncaughtException', function(error) {
  var logger = container.find('logger');

  if(logLevel == 'debug') {
    logger.error('Uncaught exception', error.message)
    logger.error(error.stack)
  } else {
    logger.error(error.message)
  }

  process.exit(1)
})
