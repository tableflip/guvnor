var AmpersandModel = require('ampersand-model')
var moment = require('moment')
var prettysize = require('prettysize')
var Logs = require('./logs')
var Exceptions = require('./exceptions')
var Snapshots = require('./snapshots')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    debugPort: 'number',
    gid: ['number', true, '?'],
    group: ['string', true, '?'],
    pid: ['number', true, '?'],
    restarts: ['number', true, '?'],
    name: ['string', true, '?'],
    uid: ['number', true, '?'],
    uptime: ['number', true, '?'],
    user: ['string', true, '?'],
    script: ['string', true, '?'],
    cwd: ['string', false, ''],
    language: ['string', false, ''],
    env: ['object', true, function () {
      return {}
    }],
    argv: ['array', true, function () {
      return []
    }],
    execArgv: ['array', true, function () {
      return []
    }],
    status: {
      type: 'string',
      values: [
        'uninitialised', 'starting', 'started', 'running', 'restarting', 'stopping',
        'stopped', 'errored', 'failed', 'aborted', 'paused', 'unresponsive'
      ]
    },
    cluster: ['boolean', false, false],
    clusterManager: ['string', false, null],

    cpu: ['array', true, function () {
      return []
    }],
    residentSize: ['array', true, function () {
      return []
    }],
    heapTotal: ['array', true, function () {
      return []
    }],
    heapUsed: ['array', true, function () {
      return []
    }],
    latency: ['array', true, function () {
      return []
    }]
  },
  session: {
    isGc: ['boolean', true, false],
    isHeapDump: ['boolean', true, false],
    isStarting: ['boolean', true, false],
    isRestarting: ['boolean', true, false],
    isStopping: ['boolean', true, false],
    isRemoving: ['boolean', true, false],
    areLogsPinned: ['boolean', true, false],
    shouldShowTimes: ['boolean', true, true],
    areExceptionsPinned: ['boolean', true, false]
  },
  derived: {
    cpuFormatted: {
      deps: ['uptime'],
      fn: function () {
        if (this.cpu.length === 0) {
          return '?'
        }

        var last = this.cpu[this.cpu.length - 1]

        if (!last) {
          return '?'
        }

        return last.x + ' %'
      }
    },
    memoryFormatted: {
      deps: ['uptime'],
      fn: function () {
        if (this.heapUsed.length === 0) {
          return '?'
        }

        var last = this.heapUsed[this.heapUsed.length - 1]

        if (!last) {
          return '?'
        }

        return prettysize(last.x)
      }
    },
    uptimeFormatted: {
      deps: ['uptime'],
      fn: function () {
        if (this.uptime === '?') {
          return this.uptime
        }

        // uptime is reported in seconds
        return moment.duration(this.uptime * 1000).humanize()
      }
    },
    isRunning: {
      deps: ['status'],
      fn: function () {
        return ['starting', 'started', 'running', 'restarting', 'stopping', 'paused', 'unresponsive'].indexOf(this.status) !== -1
      }
    },
    isPaused: {
      deps: ['status'],
      fn: function () {
        return this.status === 'paused'
      }
    }
  },
  collections: {
    logs: Logs,
    exceptions: Exceptions,
    snapshots: Snapshots
  }
})
