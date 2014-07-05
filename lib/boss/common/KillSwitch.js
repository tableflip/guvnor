var Autowire = require('wantsit').Autowire

var KillSwitch = function() {
  this._userInfo = Autowire
  this._fileSystem = Autowire
  this._parentProcess = Autowire
  this._dnode = Autowire
  this._fs = Autowire
}

KillSwitch.prototype.afterPropertiesSet = function() {
  this._fileSystem.findOrCreateProcessDirectory(function(error, directory) {
    if(error) throw error

    this._socket = directory + '/' + process.pid

    // publish RPC methods
    var dnode = this._dnode({
      kill: this._kill.bind(this)
    })
    this._server = dnode.listen(this._socket, function() {
      // server has started, make sure owning user can access it
      this._fs.chown(this._socket, this._userInfo.getUid(), this._userInfo.getGid(), function(error) {
        if(error) throw error
      }.bind(this))
    }.bind(this))
  }.bind(this))
}

KillSwitch.prototype._kill = function() {
  this._parentProcess.send({type: 'process:stopping'})

  this._server.close(function() {
    this._fs.unlink(this._socket, function(error) {
      process.exit(error ? 1 : 0)
    }.bind(this))
  }.bind(this))
}

module.exports = KillSwitch
