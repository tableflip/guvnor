var Autowire = require('wantsit').Autowire

var LogRedirector = function() {
  this._logger = Autowire
}

LogRedirector.prototype.afterPropertiesSet = function() {
  process.stderr.write = function(string) {
    this._logger.error(string)
  }.bind(this)
  process.stdout.write = function(string) {
    this._logger.info(string)
  }.bind(this)
}

module.exports = LogRedirector
