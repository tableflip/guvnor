
var async = require('async')
var dnodeSocket = require('../common/dnode-socket')
var removeSocket = require('../common/remove-socket')
var config = require('../../config')
var debug = require('debug')('daemon:rpc:user')
var operations = require('../../operations')

var UMASK = parseInt('007', 8)

module.exports = function startLocalUserRpc(callback) {
  async.auto({
    operations: operations,
    removeSocket: removeSocket.bind(null, config.USER_SOCKET),
    dnodeSocket: ['operations', 'removeSocket', function (next, results) {
      var api = {
        startProcess: results.operations.startProcess,
        listProcesses: results.operations.listProcesses
        // findProcessInfoById: results.operations.findProcessInfoById,
        // findProcessInfoByPid: results.operations.findProcessInfoByPid,
        // findProcessInfoByName: results.operations.findProcessInfoByName,
        // deployApplication: results.operations.deployApplication,
        // removeApplication: results.operations.removeApplication,
        // listApplications: results.operations.listApplications,
        // switchApplicationRef: results.operations.switchApplicationRef,
        // listApplicationRefs: results.operations.listApplicationRefs,
        // updateApplicationRefs: results.operations.updateApplicationRefs,
        // removeProcess: results.operations.removeProcess,
        // listUsers: results.operations.listUsers,
        // currentRef: results.operations.currentRef,
        // stopProcess: results.operations.stopProcess,
        // findAppByName: results.operations.findAppByName,
        // findAppById:  results.operations.findAppById
      }

      debug('Exposing user operations %o', Object.keys(api))

      dnodeSocket(UMASK, config.USER_SOCKET, api, config.RPC_TIMEOUT, next)
    }]
  }, callback)
}
