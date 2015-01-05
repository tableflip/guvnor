var Autowire = require('wantsit').Autowire

// Loads config from the parent process
var ConfigLoader = function(prefix) {
  this._prefix = prefix || 'process'
  this._parentProcess = Autowire
  this._coercer = Autowire
}

ConfigLoader.prototype.afterPropertiesSet = function(done) {
  // notify once config has been loaded from parent process
  this._parentProcess.once('boss:config:response', function(config) {
    Object.keys(config).forEach(function(key) {
      if(key.substring(0, 1) == '_') {
        return
      }

      this[key] = this._coercer(config[key])
    }.bind(this))

    done()
  }.bind(this))

  // request config from parent process
  process.nextTick(this._parentProcess.send.bind(this._parentProcess, this._prefix + ':config:request'))
}

module.exports = ConfigLoader
