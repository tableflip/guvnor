var Autowire = require('wantsit').Autowire
var async = require('async')
var crypto = require('crypto')

var RemoteUserService = function () {
  this._posix = Autowire
  this._config = Autowire
  this._os = Autowire
  this._remoteUserStore = Autowire
}

RemoteUserService.prototype.afterPropertiesSet = function () {
  // make sure we've got a user to run under..
  this.findOrCreateUser(this._config.guvnor.user, function () {})
}

RemoteUserService.prototype.findUser = function (userName, callback) {
  callback(undefined, this._remoteUserStore.find('name', userName))
}

RemoteUserService.prototype.findOrCreateUser = function (userName, callback) {
  this.findUser(userName, function (error, user) {
    if (user) {
      return callback(error, user)
    }

    this.createUser(userName, callback)
  }.bind(this))
}

RemoteUserService.prototype.createUser = function (userName, callback) {
  async.parallel([function (callback) {
      this.findUser(userName, function (error, user) {
        if (user) {
          error = new Error(userName + ' already exists')
          error.code = 'DUPLICATEUSER'
        }

        callback(error)
      })
    }.bind(this), function (callback) {
      var error

      try {
        this._posix.getpwnam(userName)
      } catch (e) {
        error = new Error(userName + ' is not a valid user on ' + this._os.hostname())
        error.code = 'INVALIDUSER'
      }

      callback(error)
    }.bind(this),
    this.generateSecret.bind(this)
  ], function (error, results) {
      if (error) {
        return callback(error)
      }

      this._remoteUserStore.create([{
        name: userName,
        secret: results[2]
      }], function (error, user) {
          if (error) {
            return callback(error)
          }

          this._remoteUserStore.save(function (error) {
            callback(error, user)
          })
        }.bind(this))
    }.bind(this))
}

RemoteUserService.prototype.removeUser = function (userName, callback) {
  this._remoteUserStore.remove('name', userName)
  this._remoteUserStore.save(callback)
}

RemoteUserService.prototype.listUsers = function (callback) {
  callback(undefined, this._remoteUserStore.all())
}

RemoteUserService.prototype._generateBytes = function (length, callback) {
  crypto.randomBytes(length, function (error, bytes) {
    callback(error, bytes ? bytes.toString('base64') : undefined)
  })
}

RemoteUserService.prototype.generateSecret = function (callback) {
  this._generateBytes(32, callback)
}

RemoteUserService.prototype.rotateKeys = function (userName, callback) {
  this.findUser(userName, function (error, user) {
    if (error) {
      return callback(error)
    }

    if (!user) {
      return callback()
    }

    this.generateSecret(function (error, secret) {
      if (error) return callback(error)

      user.secret = secret

      this._remoteUserStore.save(function (error) {
        callback(error, user)
      })
    }.bind(this))
  }.bind(this))
}

module.exports = RemoteUserService
