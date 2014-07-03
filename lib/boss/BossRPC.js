var Autowire = require('wantsit').Autowire,
  dnode = require('dnode'),
  fs = require('fs')

var BossRPC = function() {
  this._remoteProcess = Autowire
  this._fileSystem = Autowire
  this._logger = Autowire
  this._boss = Autowire
}

BossRPC.prototype.afterPropertiesSet = function() {
  // create pass-through methods for boss
  this._getApi().forEach(function(method) {
    this[method] = this._boss[method].bind(this._boss)
  }.bind(this))

  // find a socket to listen on
  this._fileSystem.createSocket(function(error, socket) {
    if(error) throw error

    this._logger.debug('Socket', socket)

    this._socket = socket

    process.on('exit', this._removeSocketFile.bind(this))
    process.on('SIGINT', this._removeSocketFile.bind(this))

    // publish RPC methods
    var server = dnode(this._generateApi())
    server.listen(this._socket)

    // all done, send our parent process a message
    this._remoteProcess.send({type: 'daemon:ready'})
  }.bind(this))
}

BossRPC.prototype._getApi = function() {
  return ['startProcess', 'stopProcess', 'listProcesses', 'setClusterWorkers']
}

BossRPC.prototype._generateApi = function() {
  var api = {};

  ['getApiMethods', 'kill'].concat(this._getApi()).forEach(function(method) {
    api[method] = function() {
      try {
        this[method].apply(this, arguments)
      } catch(error) {
        this._logger.error('Exception thrown while invoking API method')

        if(error) {
          this._logger.error(error)

          if(error.stack) {
            this._logger.error(error.stack)
          }
        } else {
          console.trace()
        }
      }
    }.bind(this)
  }.bind(this))

  return api
}

BossRPC.prototype.getApiMethods = function(callback) {
  callback(['getApiMethods', 'kill'].concat(this._getApi()))
}

BossRPC.prototype.kill = function() {
  process.exit(0)
}

BossRPC.prototype._removeSocketFile = function() {
  if(fs.existsSync(this._socket)) {
    this._logger.debug('Removing socket from', this._socket)
    fs.unlinkSync(this._socket)
  } else {
    this._logger.debug('Socket already gone?')
  }

  this.kill()
}

module.exports = BossRPC
