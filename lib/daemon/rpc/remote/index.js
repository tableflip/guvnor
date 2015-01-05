var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory

var container = new Container()
container.register('logger', {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: function() {}
})
container.register('dnode', require('dnode'))
container.register('posix', require('posix'))
container.register('config', {
  boss: {
    timeout: 10000
  }
})
container.createAndRegister('processFactory', ObjectFactory, [require('../../../common/Process')])
container.createAndRegister('remoteProcessConnector', require('./RemoteProcessConnector'))
