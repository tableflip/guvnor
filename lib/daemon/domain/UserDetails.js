var Autowire = require('wantsit').Autowire
var async = require('async')

var UserDetails = function (name) {
  this._id = name

  this._posix = Autowire
  this._child_process = Autowire
}

UserDetails.prototype.afterPropertiesSet = function (done) {
  var user = this._posix.getpwnam(this._id)

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

module.exports = UserDetails
