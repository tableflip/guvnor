var Autowire = require('wantsit').Autowire,
  async = require('async')

var CommandLine = function() {
  this._child_process = Autowire
}

CommandLine.prototype.afterPropertiesSet = function(done) {
  async.parallel([
    this._find.bind(this, 'npm'),
    this._find.bind(this, 'git')
  ], done)
}

CommandLine.prototype._find = function(command, callback) {
  this._child_process.exec('which ' + command, function(error, stdout) {
    if(error) return callback(new Error('Could not find ' + command + ' - is it installed?'))

    var path = stdout.trim()

    if(path) {
      this['_' + command] = path
    }

    callback()
  }.bind(this))
}

CommandLine.prototype.git = function(args, path, userDetails, onOut, onErr, message, callback) {
  this.exec(this._git, args, path, userDetails, onOut, onErr, message, callback)
}

CommandLine.prototype.npm = function(args, path, userDetails, onOut, onErr, message, callback) {
  this.exec(this._npm, args, path, userDetails, onOut, onErr, message, callback)
}

CommandLine.prototype.exec = function(command, args, path, userDetails, onOut, onErr, message, callback) {
  var proc = this._child_process.spawn(
    command, args, {
      cwd: path,
      uid: userDetails.uid,
      gid: userDetails.gid,
      env: {
        USER: userDetails.name,
        HOME: userDetails.homedir,
        PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin'
      }
    }
  )
  proc.stdout.on('data', function(buff) {
    onOut(buff.toString('utf8'))
  })
  proc.stderr.on('data', function(buff) {
    onErr(buff.toString('utf8'))
  })
  proc.once('close', function(code) {
    proc.removeAllListeners('data')

    callback(code !== 0 ? new Error(message) : undefined)
  })
}

module.exports = CommandLine
