var Autowire = require('wantsit').Autowire

var LogRedirector = function () {
  this._logger = Autowire
}

LogRedirector.prototype.afterPropertiesSet = function () {
  var stderr = process.stderr.write
  var stdout = process.stdout.write

  process.stderr.write = function (string, encoding, fd) {
    if (!process.send) {
      return stderr.apply(process.stderr, arguments)
    }

    this._logger.error(string)
  }.bind(this)
  process.stdout.write = function (string, encoding, fd) {
    if (!process.send) {
      return stdout.apply(process.stdout, arguments)
    }

    this._logger.info(string)
  }.bind(this)
}

module.exports = LogRedirector
