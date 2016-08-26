'use strict'

const cpuStats = require('cpu-stats')
const os = require('os')
const pkg = require('../../../package.json')
const operations = require('../')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:get-server-status'

const getServerStatus = (context) => {
  context.log([INFO, CONTEXT], 'Getting server status')

  return Promise.all([
    new Promise((resolve, reject) => {
      cpuStats(1000, (error, stats) => {
        if (error) {
          return reject(error)
        }

        resolve(stats)
      })
    }),
    operations.getOs(context)
  ])
  .then(results => {
    const status = {
      hostname: os.hostname(),
      type: os.type(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      daemon: pkg.version,
      time: Date.now(),
      uptime: os.uptime(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      cpus: os.cpus(),
      versions: process.versions
      // ,
      // debuggerPort: this._config.remote.inspector.enabled ? this._nodeInspectorWrapper.debuggerPort : undefined
    }

    results[0].forEach(function (load, index) {
      status.cpus[index].load = load
    })

    status.os = results.os

    return status
  })
}

module.exports = getServerStatus
