var Autowire = require('wantsit').Autowire,
  BossRPC = require('./BossRPC'),
  util = require('util')

var AdminRPC = function() {
  BossRPC.call(this)
}
util.inherits(AdminRPC, BossRPC)

AdminRPC.prototype._getSocketName = function() {
  return 'admin.socket'
}

AdminRPC.prototype._getApi = function() {
  return [
    'kill', 'remoteHostConfig', 'addRemoteUser', 'removeRemoteUser', 'listRemoteUsers',
    'rotateRemoteUserKeys', 'generateRemoteRpcCertificates'
  ]
}

AdminRPC.prototype._getUmask = function() {
  return 077
}

module.exports = AdminRPC
