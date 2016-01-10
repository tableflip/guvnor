var AmpersandModel = require('ampersand-model')
var moment = require('moment')
var prettysize = require('prettysize')
var Processes = require('./processes')
var Apps = require('./apps')
var Users = require('./users')
var semver = require('semver')

module.exports = AmpersandModel.extend({
  idAttribute: 'url',
  props: {
    url: 'string',
    name: 'string',
    lastUpdated: 'date',
    status: {
      type: 'string',
      values: [
        'connecting', 'connected', 'network-error',
        'server-error', 'incompatible', 'timeout'
      ]
    },
    hostname: 'string', // this is set from os.hostname()
    type: 'string',
    platform: 'string',
    arch: 'string',
    release: 'string',
    daemon: 'string',
    os: 'string',
    versions: ['object', true, function () {
      return {}
    }],
    time: 'number',
    uptime: 'number',
    freeMemory: 'number',
    totalMemory: 'number',
    debuggerPort: 'number',
    cpus: ['array', true, function () {
      return [{
        model: 'string',
        speed: 'number',
        times: ['object', false, function () {
          return {
            idle: 'number',
            irq: 'number',
            nice: 'number',
            sys: 'number',
            user: 'number'
          }
        }],
        load: ['object', false, function () {
          return {
            cpu: 'number',
            idle: 'number',
            irq: 'number',
            nice: 'number',
            sys: 'number',
            user: 'number'
          }
        }]
      }]
    }]
  },
  session: {
    selected: ['boolean', true, false],
    selectedProcess: ['any', false, null],
    appsStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading', 'install', 'installing'
      ]
    },
    usersStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading'
      ]
    }
  },
  derived: {
    timeFormatted: {
      deps: ['time'],
      fn: function () {
        return moment(this.time).format('YYYY-MM-DD HH:mm:ss Z')
      }
    },
    uptimeFormatted: {
      deps: ['uptime'],
      fn: function () {
        // uptime is reported in seconds
        return moment.duration(this.uptime * 1000).humanize()
      }
    },
    cpuSpeed: {
      deps: ['cpus'],
      fn: function () {
        if (!this.cpus[0]) {
          return ''
        }

        return this.cpus.length + 'x ' + (this.cpus[0].speed / 1000).toFixed(2) + 'GHz'
      }
    },
    usedMemory: {
      deps: ['freeMemory', 'totalMemory'],
      fn: function () {
        return ~~(((this.totalMemory - this.freeMemory) / this.totalMemory) * 100)
      }
    },
    totalMemoryFormatted: {
      deps: ['totalMemory'],
      fn: function () {
        return prettysize(this.totalMemory, true)
      }
    },
    engine: {
      deps: ['versions'],
      fn: function () {
        return (semver.satisfies(this.versions.node, '>=1.0.0 && < 4.0.0') ? 'io.js' : 'node.js') + ' ' + this.versions.node
      }
    }
  },
  collections: {
    processes: Processes,
    apps: Apps,
    users: Users
  }
})
