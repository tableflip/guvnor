var Autowire = require('wantsit').Autowire,
  util = require('util')

var CommandLine = function () {
  this._child_process = Autowire
  this._logger = Autowire
}

CommandLine.prototype._find = function (command, userDetails, callback) {
  var shell_command = util.format("which %s", command)

  this._child_process.exec(shell_command, {
    uid: userDetails.uid,
    gid: userDetails.gid,
    env: {
      USER: userDetails.name,
      HOME: userDetails.home,
      PATH: userDetails.path
    }
  }, function (error, stdout) {
    if (error || !stdout || !stdout.trim()) {
      // try with root..
      this._child_process.exec(shell_command, function (error, stdout) {
        if (error) return callback(new Error(util.format('Could not find %s in path %s or %s - is it installed?', command, userDetails.path, process.env.PATH)))

        this._found(stdout, callback)
      }.bind(this))

      return
    }

    this._found(stdout, callback)
  }.bind(this))
}

CommandLine.prototype._found = function (stdout, callback) {
  var path = stdout.trim()

  callback(undefined, path)
}

CommandLine.prototype.git = function (args, path, userDetails, onOut, onErr, message, callback) {
  this._find('git', userDetails, function (error, git) {
    if (error) return callback(error)

    this.exec(git, args, path, userDetails, onOut, onErr, message, callback)
  }.bind(this))
}

CommandLine.prototype.npm = function (args, path, userDetails, onOut, onErr, message, callback) {
  this._find('npm', userDetails, function (error, npm) {
    if (error) return callback(error)

    this.exec(npm, args, path, userDetails, onOut, onErr, message, callback)
  }.bind(this))
}

CommandLine.prototype.exec = function (command, args, path, userDetails, onOut, onErr, message, callback) {
  this._logger.debug('spawning', command, args.join(' '), 'for', userDetails)

  var proc = this._child_process.spawn(
    command, args, {
      cwd: path,
      uid: userDetails.uid,
      gid: process.getgid(),
      env: {
        USER: userDetails.name,
        HOME: userDetails.home,
        PATH: userDetails.path
      }
    }
  )
  proc.stdout.on('data', function (buff) {
    onOut(buff.toString('utf8'))
  })
  proc.stderr.on('data', function (buff) {
    onErr(buff.toString('utf8'))
  })
  proc.once('close', function (code) {
    proc.removeAllListeners('data')

    callback(code !== 0 ? new Error(message) : undefined)
  })
}

module.exports = CommandLine
