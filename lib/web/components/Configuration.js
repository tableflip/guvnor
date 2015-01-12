require('colors')

var rc = require('boss-rc'),
  path = require('path'),
  ini = require('ini'),
  fs = require('fs'),
  coerce = require('coercer'),
  Autowire = require('wantsit').Autowire

var Configuration = function() {
  // load defaults
  var defaults = coerce(ini.parse(fs.readFileSync(path.resolve(__dirname + '/../../../bossweb'), 'utf-8')))
  var clientDefaults = coerce(ini.parse(fs.readFileSync(path.resolve(__dirname + '/../../../bossweb-client'), 'utf-8')))

  // load user overrides
  var userConfig = coerce(rc('boss/bossweb', defaults, {}))
  var userClientConfig = coerce(rc('boss/bossweb-client', clientDefaults, {}))

  // load users and user/host config
  var userUsersConfig = coerce(rc('boss/bossweb-users', {}, {}))
  var userHostsConfig = coerce(rc('boss/bossweb-hosts', {}, {}))

  this.client = {
    debugMode: process.env.NODE_ENV == 'development'
  }

  // copy all properties to this
  this._copy(userConfig, this)
  this._copy(userClientConfig, this.client)
  this.hosts = userHostsConfig
  this.users = userUsersConfig

  this.client.minVersion = this.minVersion

  this._posix = Autowire
}

Configuration.prototype._copy = function(source, dest) {
  for(var key in source) {
    if(key == '_') {
      continue
    }

    Object.defineProperty(dest, key, {
      enumerable: true,
      get: function(source, key) {
        return source[key]
      }.bind(this, source, key),
      set: function(source, key, value) {
        source[key] = value
      }.bind(this, source, key)
    })
  }
}

Configuration.prototype.afterPropertiesSet = function() {
  this._checkLength(this.hosts, 'Could not read any remote hosts from the configuration file.', 'bossweb-hosts')
  this._checkLength(this.users, 'Could not read any users from the configuration file.', 'bossweb-users')

  if(!this.salt) {
    this._exitWithError(
      ['No password salt was found in the bossweb config file!'.red],
      ['Please run'.red, 'bs-web gensalt', 'and follow the instructions'.red]
    )
  }

  Object.keys(this.users).forEach(function(userName) {
    if(!this.users[userName].password) {
      this._exitWithError(
        ['User \'%s\' has no password set'.red, userName],
        ['Please run `bs-web passwd %s` to fix your configuration'.red, userName]
      )
    }

    for(var key in this.users[userName]) {
      if(key == 'password') {
        continue
      }

      if(!this.hosts[key]) {
        this._exitWithError(
          ['User \'%s\' has config set for host \'%s\' but no such host exists in bossweb-hosts!'.red, userName, key],
          ['Please fix your configuration'.red]
        )
      }
    }
  }.bind(this))

  Object.keys(this.hosts).forEach(function(hostName) {
    if(!this.hosts[hostName].host) {
      this._exitWithError(
        ['Host \'%s\' has no \'host\' property in bossweb-hosts'.red, hostName],
        ['Please fix your configuration'.red]
      )
    }

    if(!this.hosts[hostName].port) {
      this._exitWithError(
        ['Host \'%s\' has no \'port\' property in bossweb-hosts'.red, hostName],
        ['Please fix your configuration'.red]
      )
    }

    if(!this.hosts[hostName].user) {
      this._exitWithError(
        ['Host \'%s\' has no \'user\' property in bossweb-hosts'.red, hostName],
        ['Please fix your configuration'.red]
      )
    }

    if(!this.hosts[hostName].secret) {
      this._exitWithError(
        ['Host \'%s\' has no \'secret\' property in bossweb-hosts'.red, hostName],
        ['Please fix your configuration'.red]
      )
    }
  }.bind(this))
}

Configuration.prototype._exitWithError = function() {
  if(Array.isArray(arguments[0])) {
    for(var i = 0; i < arguments.length; i++) {
      console.error.apply(null, arguments[i])
    }
  } else {
    console.error.apply(null, arguments)
  }

  process.exit(1)
}

Configuration.prototype._checkLength = function(obj, message, file) {
  if(Object.keys(obj).length === 0) {
    this._emitConfigFileError(message, file)

    process.exit(1)
  }
}

Configuration.prototype._emitConfigFileError = function(message, file) {
  var user = this._posix.getpwnam(process.getuid())
  var path = user.username == 'root' ? '/etc/boss/' + file : user.dir + '/.config/boss/' + file

  console.error(message.red)
  console.error('Either the configuration file was empty or you defined it in the wrong place.'.red)
  console.error('It should be at'.red, path)
  console.error('Please follow the setup instructions in the README'.red)
}

module.exports = Configuration
