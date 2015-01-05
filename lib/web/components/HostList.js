var Autowire = require('wantsit').Autowire,
  EventEmitter = require('events').EventEmitter,
  util = require('util')

var HostList = function() {
  EventEmitter.call(this)

  this._config = Autowire
  this._logger = Autowire
  this._hostDataFactory = Autowire

  this._hostData = {}
}
util.inherits(HostList, EventEmitter)

HostList.prototype.afterPropertiesSet = function() {
  Object.keys(this._config.hosts).forEach(function(name) {
    this._hostDataFactory.create([name, this._config.hosts[name]], function(error, host) {
      if(!error) {
        this._hostData[name] = host
      }
    }.bind(this))
  }.bind(this))
}

HostList.prototype.getHosts = function() {
  var output = []

  Object.keys(this._hostData).forEach(function(key) {
    output.push(this._hostData[key])
  }.bind(this))

  return output
}

HostList.prototype.getHostByName = function(name) {
  return this._hostData[name]
}

module.exports = HostList
