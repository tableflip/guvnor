var child_process = require('child_process'),
  posix = require('posix')

module.exports = function (command, args, path, callback) {
  var userDetails = posix.getpwnam(process.getuid())

  if (arguments.length == 3) {
    callback = path
    path = process.cwd()
  }

  var stdout = ''
  var stderr = ''

  var proc = child_process.spawn(
    command, args, {
      cwd: path,
      uid: userDetails.uid,
      gid: userDetails.gid,
      env: {
        HOME: userDetails.homedir,
        PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin'
      }
    }
  )
  proc.stdout.on('data', function (buff) {
    stdout += buff.toString('utf8')
  })
  proc.stderr.on('data', function (buff) {
    stderr += buff.toString('utf8')
  })
  proc.once('close', function (code) {
    proc.removeAllListeners('data')

    callback(code != 0 ? new Error('Process failed') : undefined, stdout, stderr)
  })
}
