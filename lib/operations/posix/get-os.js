var child_process = require('child_process')
var loadOnce = require('load-once')

function getOs (user, callback) {
  child_process.exec('uname -a', function (error, stdout) {
    var os = 'unknown'

    if (!error && stdout) {
      stdout = stdout.toLowerCase()

      if (stdout.indexOf('centos') !== -1) {
        os = 'centos'
      } else if (stdout.indexOf('darwin') !== -1) {
        os = 'darwin'
      } else if (stdout.indexOf('debian') !== -1) {
        os = 'debian'
      } else if (stdout.indexOf('fedora') !== -1) {
        os = 'fedora'
      } else if (stdout.indexOf('freebsd') !== -1) {
        os = 'freebsd'
      } else if (stdout.indexOf('mint') !== -1) {
        os = 'mint'
      } else if (stdout.indexOf('netbsd') !== -1) {
        os = 'netbsd'
      } else if (stdout.indexOf('raspberrypi') !== -1) {
        os = 'raspberrypi'
      } else if (stdout.indexOf('redhat') !== -1) {
        os = 'redhat'
      } else if (stdout.indexOf('solaris') !== -1 || stdout.indexOf('sunos') !== -1) {
        os = 'solaris'
      } else if (stdout.indexOf('suse') !== -1) {
        os = 'suse'
      } else if (stdout.indexOf('ubuntu') !== -1) {
        os = 'ubuntu'
      } else if (stdout.indexOf('linux') !== -1) {
        os = 'linux'
      }
    }

    callback(null, os)
  })
}

module.exports = loadOnce(getOs)
