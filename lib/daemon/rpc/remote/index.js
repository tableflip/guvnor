require('../../../common/HelpfulError.js')

var Container = require('wantsit').Container
var ObjectFactory = require('wantsit').ObjectFactory

var container = new Container()
container.register('logger', {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: function () {}
})
container.register('dnode', require('boss-dnode'))
container.register('posix', require('posix'))
container.register('config', {
  guvnor: {
    timeout: parseInt(process.env.GUVNOR_TIMEOUT, 10),
    rpctimeout: parseInt(process.env.GUVNOR_RPC_TIMEOUT, 10)
  }
})
container.createAndRegister('managedProcessFactory', ObjectFactory, [require('../../../common/ManagedProcess')])
container.createAndRegister('remoteProcessConnector', require('./RemoteProcessConnector'))
