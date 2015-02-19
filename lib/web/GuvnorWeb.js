var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory,
  logger = require('andlog')

var GuvnorWeb = function() {
  process.title = 'guvnor-web'

  // make errors a little more descriptive
  process.on('uncaughtException', function(error) {
    console.error('Uncaught error', error && error.stack ? error.stack : 'No stack trace available')

    process.exit(1)
  })

  process.on('SIGABRT', function() {
    console.error('Received SIGABRT')
  })

  // create container
  var container = new Container({
    timeout: 0
  })
  container.on('error', function(error) {
    console.warn('Container error:', error.message || error.message.stack)
  })

  // parse configuration
  container.createAndRegister('config', require('./components/Configuration'))
  container.register('logger', logger)
  container.register('posix', require('posix'))
  container.register('remote', require('../remote'))
  container.register('webSocketResponder', {
    broadcast: function() {}
  })
  container.register('moonbootsConfig', {
    'isDev': process.env.NODE_ENV == 'development'
  })
  container.createAndRegister('hostDataFactory', ObjectFactory, [require('./domain/HostData')])
  container.createAndRegister('processDataFactory', ObjectFactory, [require('./domain/ProcessData')])
  container.createAndRegister('hostList', require('./components/HostList'))
  container.createAndRegister('server', require('./Server'))

  // optional dependency, don't care if it fails
  try {
    container.register('mdns', require('mdns'))
  } catch(e) {
    logger.info('Failed to register mdns component. If running Linux, please run `$ sudo apt-get install libavahi-compat-libdnssd-dev` before installing guvnor.')
    logger.info(e.stack)
  }
}

module.exports = GuvnorWeb
