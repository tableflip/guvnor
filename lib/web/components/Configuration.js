require('colors')

var rc = require('rc')
var path = require('path')
var ini = require('ini')
var fs = require('fs')
var coerce = require('coercer')
var Autowire = require('wantsit').Autowire

var Configuration = function () {
  // load defaults
  var defaults = coerce(ini.parse(fs.readFileSync(path.resolve(__dirname + '/../../../guvnor-web'), 'utf-8')))
  var clientDefaults = coerce(ini.parse(fs.readFileSync(path.resolve(__dirname + '/../../../guvnor-web-client'), 'utf-8')))

  // load user overrides
  var userConfig = coerce(rc('guvnor/guvnor-web', defaults, {}))
  var userClientConfig = coerce(rc('guvnor/guvnor-web-client', clientDefaults, {}))

  // load users and user/host config
  var userUsersConfig = coerce(rc('guvnor/guvnor-web-users', {}, {}))
  var userHostsConfig = coerce(rc('guvnor/guvnor-web-hosts', {}, {}))

  this.client = {
    debugMode: process.env.NODE_ENV === 'development'
  }

  // copy all properties to this
  this._copy(userConfig, this)
  this._copy(userClientConfig, this.client)
  this.hosts = userHostsConfig
  this.users = userUsersConfig

  this.client.minVersion = this.minVersion
  this.client.dataPoints = this.graph.max

  this._posix = Autowire
  this._logger = Autowire
}

Configuration.prototype._copy = function (source, dest) {
  for (var key in source) {
    if (key === '_') {
      continue
    }

    Object.defineProperty(dest, key, {
      enumerable: true,
      get: function (source, key) {
        return source[key]
      }.bind(this, source, key),
      set: function (source, key, value) {
        source[key] = value
      }.bind(this, source, key)
    })
  }
}

Configuration.prototype.afterPropertiesSet = function () {
  this._checkLength(this.hosts, 'Could not read any remote hosts from the configuration file.', 'guvnor-web-hosts')
  this._checkLength(this.users, 'Could not read any users from the configuration file.', 'guvnor-web-users')

  Object.keys(this.users).forEach(function (userName) {
    if (!this.users[userName].password) {
      this._exitWithError(
        ["User '%s' has no password set".red, userName],
        ['Please run `guv-web passwd %s` to fix your configuration'.red, userName]
      )
    }

    for (var key in this.users[userName]) {
      if (key === 'password') {
        continue
      }

      if (!this.hosts[key]) {
        this._exitWithError(
          ["User '%s' has config set for host '%s' but no such host exists in guvnor-web-hosts!".red, userName, key],
          ['Please fix your configuration'.red]
        )
      }
    }
  }.bind(this))

  Object.keys(this.hosts).forEach(function (hostName) {
    if (!this.hosts[hostName].host && !this.hosts[hostName].port) {
      this._logger.info('%s has been configured with no host or port so will only appear if it can be resolved via mDNS', hostName)
    }

    if (!this.hosts[hostName].user) {
      this._exitWithError(
        ["Host '%s' has no 'user' property in guvnor-web-hosts".red, hostName],
        ['Please fix your configuration'.red]
      )
    }

    if (!this.hosts[hostName].secret) {
      this._exitWithError(
        ["Host '%s' has no 'secret' property in guvnor-web-hosts".red, hostName],
        ['Please fix your configuration'.red]
      )
    }
  }.bind(this))
}

Configuration.prototype._exitWithError = function () {
  if (Array.isArray(arguments[0])) {
    for (var i = 0; i < arguments.length; i++) {
      console.error.apply(null, arguments[i])
    }
  } else {
    console.error.apply(null, arguments)
  }

  process.exit(1)
}

Configuration.prototype._checkLength = function (obj, message, file) {
  if (Object.keys(obj).length === 0) {
    this._emitConfigFileError(message, file)

    process.exit(1)
  }
}

Configuration.prototype._emitConfigFileError = function (message, file) {
  var user = this._posix.getpwnam(process.getuid())
  var path = user.username === 'root' ? '/etc/guvnor/' + file : user.dir + '/.config/guvnor/' + file

  console.error(message.red)
  console.error('Either the configuration file was empty or you defined it in the wrong place.'.red)
  console.error('It should be at'.red, path)
  console.error('Please follow the setup instructions in the README'.red)
}

module.exports = Configuration
