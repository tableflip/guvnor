var Autowire = require('wantsit').Autowire
var async = require('async')

var MAX_PORT_ATTEMPTS = 20

var PortService = function () {
  this._net = Autowire
  this._config = Autowire
}

PortService.prototype.afterPropertiesSet = function () {
  if (this._config.ports && this._config.ports.start && this._config.ports.end) {
    this._nextPort = this._config.ports.start
  }
}

PortService.prototype.freePort = function (callback) {
  if (this._nextPort) {
    async.retry(MAX_PORT_ATTEMPTS, function (callback) {
      this._findFreePort(this._nextPort, function (error, port) {
        this._nextPort++

        if (this._nextPort > this._config.ports.end) {
          this._nextPort = this._config.ports.start
        }

        callback(error, port)
      }.bind(this))
    }.bind(this), callback)
  } else {
    this._findFreePort(0, callback)
  }
}

PortService.prototype._findFreePort = function (port, callback) {
  var server = this._net.createServer()
  server.on('listening', function () {
    port = server.address().port
    server.close()
  })
  server.on('close', function () {
    callback(undefined, port)
  })
  server.listen(port, '127.0.0.1')
}

module.exports = PortService
