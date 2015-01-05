var Container = require('wantsit').Container,
  logger = require('andlog')

var BossWeb = function() {
  process.title = 'boss-web'

  // make errors a little more descriptive
  process.on('uncaughtException', function (exception) {
    container.find('logger').error('Uncaught exception', exception && exception.stack ? exception.stack : 'No stack trace available')

    throw exception
  }.bind(this))

  // create container
  var container = new Container()

  // parse configuration
  container.createAndRegister('config', require('./components/Configuration'))
  container.register('logger', logger)
  container.register('posix', require('posix'))
  container.register('moonbootsConfig', {
    'isDev': process.env.NODE_ENV == 'development'
  })
  container.createAndRegister('server', require('./Server'))
}

module.exports = BossWeb
