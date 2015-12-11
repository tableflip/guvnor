var AmpersandModel = require('ampersand-model')
var moment = require('moment')
var prettysize = require('prettysize')

module.exports = AmpersandModel.extend({
  idAttribute: 'pid',
  props: {
    pid: 'number',
    user: 'string',
    group: 'string',
    uid: 'number',
    gid: 'number',
    uptime: 'number',
    cpu: 'number',
    heapTotal: 'number',
    heapUsed: 'number',
    residentSize: 'number',
    cwd: 'string',
    latency: 'number',
    argv: ['array', true, function () {
      return []
    }],
    execArgv: ['array', true, function () {
      return []
    }]
  },
  session: {
    cpuHistory: ['array', true, function () {
      return []
    }],
    residentSizeHistory: ['array', true, function () {
      return []
    }],
    heapTotalHistory: ['array', true, function () {
      return []
    }],
    heapUsedHistory: ['array', true, function () {
      return []
    }],
    latencyHistory: ['array', true, function () {
      return []
    }],

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
    _: {
      deps: ['uptime'],
      fn: function () {
        var now = Date.now()

        this.cpuHistory.push({x: now, y: this.cpu})
        this.latencyHistory.push({x: now, y: this.latency})
        this.residentSizeHistory.push({x: now, y: this.residentSize})
        this.heapTotalHistory.push({x: now, y: this.heapTotal})
        this.heapUsedHistory.push({x: now, y: this.heapUsed})
      }
    },

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

        return last.y + ' %'
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

        return prettysize(last.y)
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
    }
  }
})
