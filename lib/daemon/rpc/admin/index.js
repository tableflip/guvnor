
var async = require('async')
var dnodeSocket = require('../common/dnode-socket')
var removeSocket = require('../common/remove-socket')
var config = require('../../config')
var debug = require('debug')('daemon:rpc:admin')
var operations = require('../../operations')

var UMASK = parseInt('077', 8)

module.exports = function startLocalAdminRpc(callback) {
  async.auto({
    operations: operations,
    removeSocket: removeSocket.bind(null, config.ADMIN_SOCKET),
    dnodeSocket: ['operations', 'removeSocket', function (next, results) {
      var api = {
        // kill: results.operations.kill,
        // remoteHostConfig: results.operations.remoteHostConfig,
        // addRemoteUser: results.operations.addRemoteUser,
        // removeRemoteUser: results.operations.removeRemoteUser,
        // listRemoteUsers: results.operations.listRemoteUsers,
        // rotateRemoteUserKeys: results.operations.rotateRemoteUserKeys,
        // generateRemoteRpcCertificates: results.operations.generateRemoteRpcCertificates,
        // startProcessAsUser: results.operations.startProcessAsUser,
        // dumpProcesses: results.operations.dumpProcesses,
        // restoreProcesses: results.operations.restoreProcesses
      }

      debug('Exposing admin operations %o', Object.keys(api))

      dnodeSocket(UMASK, config.ADMIN_SOCKET, api, config.RPC_TIMEOUT, next)
    }]
  }, callback)
}
