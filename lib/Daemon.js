var dnode = require('dnode'),
  fs = require('fs'),
  LogRedirector = require('./LogRedirector'),
  file = require('file'),
  path = require('path')

var Daemon = function() {

}

Daemon.prototype._start = function(socket, infolog, errorlog) {
  [socket, infolog, errorlog].forEach(function(f) {
    var directory = path.dirname(f)

    try {
      file.mkdirsSync(directory)
    } catch(e) {
      if(e.code == 'EACCES') {
        // we do not have permissions to create these files :(
        process.send({type: 'daemon:fatality', message: 'I tried to make a directory: ' + directory + ' but I couldn\'t. Please ensure that I am run as a user with sufficient permissions.'})
      } else {
        throw e
      }
    }
  })

  this._socket = socket

  var redirector = new LogRedirector(infolog, errorlog)
  redirector.on('ready', function() {
    process.on('exit', function() {
      console.info('exiting, removing socket from', this._socket)
      if(fs.existsSync(this._socket)) {
        fs.unlinkSync(this._socket)
      }
    }.bind(this))

    // publish RPC methods
    var server = dnode(this._generateApi())
    server.listen(this._socket)

    // all done, send our parent process a message
    process.send({type: 'daemon:ready'})
  }.bind(this))
}

Daemon.prototype._generateApi = function() {
  var api = {};

  ['getApiMethods', 'kill'].concat(this._getApi()).forEach(function(method) {
    api[method] = this[method].bind(this)
  }.bind(this))

  return api
}

Daemon.prototype._getApi = function() {
  return []
}

Daemon.prototype.getApiMethods = function(callback) {
  callback(['getApiMethods', 'kill'].concat(this._getApi()))
}

Daemon.prototype.kill = function() {
  process.exit(0)
}

module.exports = Daemon
