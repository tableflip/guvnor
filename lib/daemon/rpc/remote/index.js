var Container = require('wantsit').Container,
  ObjectFactory = require('wantsit').ObjectFactory

var container = new Container()
container.register('logger', {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: function() {}
})
container.register('dnode', require('boss-dnode'))
container.register('posix', require('posix'))
container.register('config', {
  boss: {
    timeout: parseInt(process.env.BOSS_TIMEOUT, 10),
    rpctimeout: parseInt(process.env.BOSS_RPC_TIMEOUT, 10)
  }
})
container.createAndRegister('processFactory', ObjectFactory, [require('../../../common/Process')])
container.createAndRegister('remoteProcessConnector', require('./RemoteProcessConnector'))
