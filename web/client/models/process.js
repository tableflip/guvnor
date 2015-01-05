var AmpersandModel = require('ampersand-model'),
  moment = require('moment'),
  prettysize = require('prettysize'),
  Logs = require('./logs'),
  Exceptions = require('./exceptions'),
  CPUUsage = require('./cpuUsage'),
  RSSUsage = require('./rssUsage'),
  TotalHeapUsage = require('./totalHeapUsage'),
  UsedHeapUsage = require('./usedHeapUsage')

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
    cwd: ['string', true, '?'],
    env: ['object', true, function() {
      return {}
    }],
    argv: ['array', true, function() {
      return []
    }],
    execArgv: ['array', true, function() {
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
    clusterManager: ['string', false, null]
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
        if(this.cpu.length === 0) {
          return '?'
        }

        var last = this.cpu.at(this.cpu.length - 1)

        if(!last || !last.y) {
          return '?'
        }

        return last.y + '%'
      }
    },
    memoryFormatted: {
      deps: ['uptime'],
      fn: function () {
        if(this.heapUsed.length === 0) {
          return '?'
        }

        var last = this.heapUsed.at(this.heapUsed.length - 1)

        if(!last) {
          return '?'
        }

        return prettysize(last.y, true)
      }
    },
    uptimeFormatted: {
      deps: ['uptime'],
      fn: function () {
        if(this.uptime == '?') {
          return this.uptime
        }

        // uptime is reported in seconds
        return moment.duration(this.uptime * 1000).humanize()
      }
    },
    isRunning: {
      deps: ['status'],
      fn: function () {
        return ['starting', 'started', 'running', 'restarting', 'stopping', 'paused', 'unresponsive'].indexOf(this.status) != -1
      }
    },
    isPaused: {
      deps: ['status'],
      fn: function () {
        return this.status == 'paused'
      }
    }
  },
  collections: {
    logs: Logs,
    exceptions: Exceptions,
    cpu: CPUUsage,
    residentSize: RSSUsage,
    heapTotal: TotalHeapUsage,
    heapUsed: UsedHeapUsage
  }
})
