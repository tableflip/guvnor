var Autowire = require('wantsit').Autowire
var async = require('async')

var UserDetails = function (name) {
  this._id = name

  this._posix = Autowire
  this._child_process = Autowire
}

UserDetails.prototype.afterPropertiesSet = function (done) {
  var user = this._posix.getpwnam(this._id)
  var group = this._posix.getgrnam(user.gid)

  delete this._id

  async.parallel([
    this._child_process.execFile.bind(this._child_process, 'sudo', ['-u', user.name, 'printenv', 'PATH'], {
      uid: process.getuid(),
      gid: process.getgid()
    }),
    this._child_process.execFile.bind(this._child_process, 'sudo', ['-u', user.name, 'groups'], {
      uid: process.getuid(),
      gid: process.getgid()
    })
  ], function (error, results) {
    if (error) {
      return done(error)
    }

    var path = results[0][0].trim()
    var groups = results[1][0].trim().split(' ')

    Object.defineProperties(this, {
      'group': {
        value: group.name,
        enumerable: true
      },
      'groups': {
        value: groups,
        enumerable: true
      },
      'gid': {
        value: user.gid,
        enumerable: true
      },
      'uid': {
        value: user.uid,
        enumerable: true
      },
      'home': {
        value: user.dir,
        enumerable: true
      },
      'name': {
        value: user.name,
        enumerable: true
      },
      'shell': {
        value: user.shell,
        enumerable: true
      },
      'path': {
        value: path,
        enumerable: true
      }
    })

    done()
  }.bind(this))
}
/*
UserDetails.prototype.getGroups = function (callback) {
  if (this._groups) {
    process.nextTick(callback.bind(null, this._groups))

    return
  }

  this._child_process.execFile('sudo', ['-u', this.name, 'groups'], {
    uid: process.getuid(),
    gid: process.getgid()
  }, function (error, stdout) {
    if (error) {
      return callback(error)
    }

    this._groups = stdout.trim().split(' ')

    callback(undefined, this._groups)
  })
}

UserDetails.prototype.getPath = function (callback) {
  if (this._path) {
    process.nextTick(callback.bind(null, this._path))

    return
  }

  this.getEnvironment(function (error, env) {
    callback(error, error ? undefined : env.PATH)
  })
}

UserDetails.prototype.getEnvironment = function (callback) {
  if (this._env) {
    process.nextTick(callback.bind(null, this._env))

    return
  }

  this._child_process.execFile('sudo', ['-u', this.user, 'env'], {
    uid: process.getuid(),
    gid: process.getgid()
  }, function (error, stdout) {
    if (error) {
      return callback(error)
    }

    var env = {}

    stdout.split('\n').forEach(function (line) {
      var index = line.indexOf('=')

      if (index === -1) {
        return
      }

      env[line.substring(0, index).trim()] = line.substring(index + 1).trim()
    })

    this._env = env

    callback(undefined, env)
  })
}
*/
module.exports = UserDetails
