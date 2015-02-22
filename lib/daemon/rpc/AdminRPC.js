var Autowire = require('wantsit').Autowire,
  RPCEndpoint = require('./RPCEndpoint'),
  util = require('util')

var AdminRPC = function() {
  RPCEndpoint.call(this)
}
util.inherits(AdminRPC, RPCEndpoint)

AdminRPC.prototype._getSocketName = function() {
  return 'admin.socket'
}

AdminRPC.prototype._getApi = function() {
  return [
    'kill', 'remoteHostConfig', 'addRemoteUser', 'removeRemoteUser', 'listRemoteUsers',
    'rotateRemoteUserKeys', 'generateRemoteRpcCertificates', 'startProcessAsUser',
    'dumpProcesses', 'restoreProcesses'
  ]
}

AdminRPC.prototype._getUmask = function() {
  return 077
}

module.exports = AdminRPC
