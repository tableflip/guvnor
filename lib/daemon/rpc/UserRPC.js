var Autowire = require('wantsit').Autowire,
  BossRPC = require('./BossRPC'),
  util = require('util')

var UserRPC = function() {
  BossRPC.call(this)

  this._processService = Autowire
  this._appService = Autowire
}
util.inherits(UserRPC, BossRPC)

UserRPC.prototype.afterPropertiesSet = function(done) {
  BossRPC.prototype.afterPropertiesSet.call(this, done)

  // broadcast events to all dnode clients
  this._boss.on('*', this.broadcast.bind(this))
  this._processService.on('*', this.broadcast.bind(this))
  this._appService.on('*', this.broadcast.bind(this))
}

UserRPC.prototype._getApi = function() {
  return [
    'startProcess', 'listProcesses', 'findProcessInfoById',
    'findProcessInfoByPid', 'findProcessInfoByName', 'dumpProcesses', 'restoreProcesses',
    'sendSignal', 'deployApplication', 'removeApplication', 'listApplications',
    'switchApplicationRef', 'listApplicationRefs', 'updateApplicationRefs',
    'removeProcess'
  ]
}

UserRPC.prototype._getSocketName = function() {
  return 'user.socket'
}

UserRPC.prototype._getUmask = function() {
  return parseInt('007', 8)
}

module.exports = UserRPC
