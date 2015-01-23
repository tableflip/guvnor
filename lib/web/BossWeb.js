var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory,
  logger = require('andlog')

var BossWeb = function() {
  process.title = 'boss-web'

  // make errors a little more descriptive
  process.on('uncaughtException', function(error) {
    container.find('logger').error('Uncaught error', error && error.stack ? error.stack : 'No stack trace available')

    throw error
  }.bind(this))

  // create container
  var container = new Container({
    timeout: 0
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
    container.register('mdns', require('boss-mdns'))
  } catch(e) {}
}

module.exports = BossWeb
