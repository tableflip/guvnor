var AmpersandModel = require('ampersand-model')
var prettysize = require('prettysize')
var Logs = require('./logs')
var Exceptions = require('./exceptions')
var Snapshots = require('./snapshots')
var Workers = require('./workers')
var ProcessInfo = require('./process-info')

module.exports = AmpersandModel.extend({
  idAttribute: 'name',
  props: {
    name: ['string', true, '?'],
    script: ['string', true, '?'],
    status: {
      type: 'string',
      values: [
        'running', 'stopped', 'error', 'unknown', 'paused'
      ]
    }
  },
  children: {
    master: ProcessInfo
  },
  session: {
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
      deps: ['master'],
      fn: function () {
        if (!this.master || this.master.cpu === undefined) {
          return '?'
        }

        var total = [this.master.cpu]
        .concat(this.workers.map(function (worker) {
          return worker.cpu
        }))
        .reduce(function (last, current) {
          return last + current
        }, 0)

        return total + '%'
      }
    },
    memoryFormatted: {
      deps: ['master'],
      fn: function () {
        if (!this.master || this.master.heapUsed === undefined) {
          return '?'
        }

        var total = [this.master.heapUsed]
        .concat(this.workers.map(function (worker) {
          return worker.heapUsed
        }))
        .reduce(function (last, current) {
          return last + current
        }, 0)

        if (!total) {
          return '?'
        }

        return prettysize(total)
      }
    },
    'user': {
      deps: ['status'],
      fn: function () {
        if (!this.master || this.master.user === undefined) {
          return '?'
        }

        return this.master.user
      }
    },
    'group': {
      deps: ['status'],
      fn: function () {
        if (!this.master || this.master.user === undefined) {
          return '?'
        }

        return this.master.group
      }
    },
    uptimeFormatted: {
      deps: ['master.uptime'],
      fn: function () {
        if (!this.master || this.master.uptime === undefined) {
          return '?'
        }

        return this.master.uptimeFormatted
      }
    },
    isRunning: {
      deps: ['status'],
      fn: function () {
        return this.status === 'running'
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
    snapshots: Snapshots,
    workers: Workers
  }
})
