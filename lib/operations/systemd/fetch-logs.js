'use strict'

const spawn = require('child_process').spawn
const config = require('./config')

const fetchLogs = (context, options) => {
  return new Promise((resolve, reject) => {
    const args = []

    if (options.follow) {
      args.push('-f')
    }

    args.push('-u')

    if (options.script) {
      args.push(`guvnor.${options.script}.service`)
    } else {
      args.push('guvnor.*.service')
    }

    const proc = spawn(config.JOURNALCTL_PATH, args)
    proc.on('error', () => {})

    resolve({
      details: {},
      stream: proc.stdout
    })
  })
}

module.exports = fetchLogs
