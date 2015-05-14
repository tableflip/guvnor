var Autowire = require('wantsit').Autowire
var RPCEndpoint = require('./RPCEndpoint')
var util = require('util')

var UserRPC = function () {
  RPCEndpoint.call(this)

  this._processService = Autowire
  this._appService = Autowire
}
util.inherits(UserRPC, RPCEndpoint)

UserRPC.prototype.afterPropertiesSet = function (done) {
  RPCEndpoint.prototype.afterPropertiesSet.call(this, done)

  // broadcast events to all dnode clients
  this._guvnor.on('*', this.broadcast.bind(this))
  this._processService.on('*', this.broadcast.bind(this))
  this._appService.on('*', this.broadcast.bind(this))
}

UserRPC.prototype._getApi = function () {
  return [
    'startProcess', 'listProcesses', 'findProcessInfoById',
    'findProcessInfoByPid', 'findProcessInfoByName', 'deployApplication',
    'removeApplication', 'listApplications', 'switchApplicationRef',
    'listApplicationRefs', 'updateApplicationRefs', 'removeProcess',
    'listUsers', 'currentRef', 'stopProcess', 'findAppByName', 'findAppById'
  ]
}

UserRPC.prototype._getSocketName = function () {
  return 'user.socket'
}

UserRPC.prototype._getUmask = function () {
  return parseInt('007', 8)
}

module.exports = UserRPC
