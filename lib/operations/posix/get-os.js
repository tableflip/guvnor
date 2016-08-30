'use strict'

const execFile = require('mz/child_process').execFile

let promise

const getOs = (context) => {
  if (!promise) {
    promise = execFile('uname', ['-a'])
    .then(result => {
      const stdout = result[0].toLowerCase()

      if (stdout.indexOf('centos') !== -1) {
        return 'centos'
      } else if (stdout.indexOf('darwin') !== -1) {
        return 'darwin'
      } else if (stdout.indexOf('debian') !== -1) {
        return 'debian'
      } else if (stdout.indexOf('fedora') !== -1) {
        return 'fedora'
      } else if (stdout.indexOf('freebsd') !== -1) {
        return 'freebsd'
      } else if (stdout.indexOf('mint') !== -1) {
        return 'mint'
      } else if (stdout.indexOf('netbsd') !== -1) {
        return 'netbsd'
      } else if (stdout.indexOf('raspberrypi') !== -1) {
        return 'raspberrypi'
      } else if (stdout.indexOf('redhat') !== -1) {
        return 'redhat'
      } else if (stdout.indexOf('solaris') !== -1 || stdout.indexOf('sunos') !== -1) {
        return 'solaris'
      } else if (stdout.indexOf('suse') !== -1) {
        return 'suse'
      } else if (stdout.indexOf('ubuntu') !== -1) {
        return 'ubuntu'
      } else if (stdout.indexOf('chip') !== -1) {
        return 'chip'
      } else if (stdout.indexOf('linux') !== -1) {
        return 'linux'
      }

      return 'unknown'
    })
  }

  return promise
}

module.exports = getOs
