require('colors')

var Container = require('wantsit').Container
var winston = require('winston')
var connectOrStart = require('../local').connectOrStart
var running = require('../local').running
var stopDaemon = require('../local').stopDaemon

module.exports = function () {
  var logLevel = (process.argv.indexOf('--verbose') !== -1 || process.argv.indexOf('-v') !== -1) ? 'debug' : 'warn'

  winston.remove(winston.transports.Console)
  winston.add(winston.transports.Console, new winston.transports.Console({
    colorize: true,
    level: logLevel
  }))

  var container = new Container()
  container.register('config', require('./config'))
  container.register('logger', winston)
  container.register('connectOrStart', connectOrStart.bind(null, container.find('config'), container.find('logger')))
  container.register('running', running)
  container.register('stopDaemon', stopDaemon)
  container.register('posix', require('posix'))
  container.register('commander', require('./commander'))
  container.register('package', require('../../package.json'))
  container.register('moment', require('moment'))
  container.register('user', require('posix').getpwnam(process.getuid()))
  container.register('group', require('posix').getgrnam(process.getgid()))
  container.register('formatMemory', require('prettysize'))
  container.register('os', require('os'))
  container.register('fs', require('fs'))
  container.register('execSync', require('../common/ExecSync'))
  container.register('prompt', require('prompt'))
  container.register('child_process', require('child_process'))
  container.createAndRegister('apps', require('./Apps'))
  container.createAndRegister('cluster', require('./Cluster'))
  container.createAndRegister('daemon', require('./Daemon'))
  container.createAndRegister('processes', require('./Processes'))
  container.createAndRegister('remote', require('./Remote'))
  container.createAndRegister('cli', require('./CLI'))

  process.on('uncaughtException', function (error) {
    var logger = container.find('logger')

    if (logLevel === 'debug') {
      logger.error('Uncaught exception', error.message)
      logger.error(error.stack)
    } else if (error.message && error.message !== 'undefined') {
      logger.error(error.message)
    }

    process.exit(1)
  })
}
