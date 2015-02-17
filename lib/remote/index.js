var Container = require('wantsit').Container

var container = new Container()
container.register('logger', {})
container.register('config', {})
container.register('dnode', require('boss-dnode'))
container.register('tls', require('tls'))
container.createAndRegister('crypto', require('../common/Crypto'))

var connect = function() {
  var args = Array.prototype.slice.apply(arguments)
  var callback = args[args.length - 1]

  container._logger = findLogger.apply(null, args)

  container.register('logger', findLogger.apply(null, args))

  var remoteOptions = findRemoteOptions.apply(null, args)

  if(!remoteOptions) {
    return callback(new Error('Please pass an options object with your connection info'))
  }

  var host = remoteOptions.host
  var port = remoteOptions.port
  var secret = remoteOptions.secret
  var principal = remoteOptions.user || 'root'
  var timeout = remoteOptions.timeout || 10000
  var rpcTimeout = remoteOptions.rpcTimeout == undefined ? 30000 : remoteOptions.rpcTimeout

  container.create(require('./RemoteDaemon'), [host, port, principal, secret, timeout, rpcTimeout, callback], function(error, remoteDaemon) {
    remoteDaemon.connect(args[args.length - 1])
  })
}

function findLogger() {
  for(var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if(arg.info && arg.warn && arg.error && arg.debug) {
      return arg
    }
  }

  return {
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: function() {}
  }
}

function findRemoteOptions() {
  for(var i = 0; i < arguments.length; i++) {
    var arg = arguments[i]

    if(arg.host && arg.port && arg.secret) {
      return arg
    }
  }
}

module.exports = connect
