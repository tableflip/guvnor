var DaemonStarter = require('./DaemonStarter')
  Autowire = require('wantsit').Autowire,
  path = require('path'),
  util = require('util')

var BossDaemonStarter = function(socket, module) {
  DaemonStarter.call(this)

  this._fileSystem = Autowire
}
util.inherits(BossDaemonStarter, DaemonStarter)

BossDaemonStarter.prototype.getSocket = function(callback) {
  return this._fileSystem.findOrCreateRunDirectory(function(error, runDirectory) {
    callback(error, runDirectory + '/socket')
  })
}

BossDaemonStarter.prototype.getModule = function() {
  return path.resolve(__dirname, '../../boss.js')
}

module.exports = BossDaemonStarter
