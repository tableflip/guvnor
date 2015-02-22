var Autowire = require('wantsit').Autowire

var UserDetails = function(name) {
  this._id = name

  this._posix = Autowire
  this._logger = Autowire
  this._child_process = Autowire
}

UserDetails.prototype.afterPropertiesSet = function(done) {
  var user = this._posix.getpwnam(this._id)

  delete this._id

  this._child_process.execFile('sudo', ['-u', user.name, 'env'], {
    uid: process.getuid(),
    gid: process.getgid()
  }, function(error, stdout) {
    if(error) return done(error)

    var path = process.env.PATH

    stdout.trim().split('\n').forEach(function(line) {
      line = line.trim()

      if(line.substr(0, 4) == 'PATH') {
        path = line.split('=')[1].trim()
      }
    })

    Object.defineProperties(this, {
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
