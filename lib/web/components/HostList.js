var Autowire = require('wantsit').Autowire,
  EventEmitter = require('events').EventEmitter,
  util = require('util')

var HostList = function() {
  EventEmitter.call(this)

  this._config = Autowire
  this._logger = Autowire
  this._hostDataFactory = Autowire
  this._mdns = Autowire

  this._hostData = {}
}
util.inherits(HostList, EventEmitter)

HostList.prototype.afterPropertiesSet = function() {
  this._createHostData()
  this._createMdnsBrowser()
}

HostList.prototype._createHostData = function() {
  Object.keys(this._config.hosts).forEach(function(name) {
    if(!this._config.hosts[name].host || !this._config.hosts[name].port) {
      return
    }

    this._hostDataFactory.create([name, this._config.hosts[name]], function(error, host) {
      if(!error) {
        this._hostData[name] = host
      }
    }.bind(this))
  }.bind(this))
}

HostList.prototype._createMdnsBrowser = function() {
  if(!this._mdns) {
    return
  }

  var browser = this._mdns.createBrowser(this._mdns.tcp('boss-rpc'));
  browser.on('error', function(error) {
    this._logger.warn('MDNS error', error.message || error.stack)
  }.bind(this))
  browser.on('serviceUp', function(service) {
    this._logger.info('Found Boss running on %s via MDNS advert', service.name)

    if(!this._config.hosts[service.name]) {
      this._logger.info('No configuration for %s exists so ignoring', service.name)

      return
    }

    if(this._hostData[service.name]) {
      this._logger.info('Already configured %s so ignoring', service.name)

      return
    }

    // if the same service exposes itself via multiple interfaces, we can get called
    // again before the factory below finishes creating the instance so put a value
    // in the host map to prevent us connecting more than once...
    this._hostData[service.name] = true

    this._hostDataFactory.create([service.name, {
      host: service.host,
      port: service.port,
      user: this._config.hosts[service.name].user,
      secret: this._config.hosts[service.name].secret
    }], function(error, host) {
      // remove the placeholder for the service
      delete this._hostData[service.name]

      if(!error) {
        this._hostData[service.name] = host
      }
    }.bind(this))
  }.bind(this))
  browser.start()
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
