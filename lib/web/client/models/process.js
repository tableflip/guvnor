var AmpersandModel = require('ampersand-model')
var prettysize = require('prettysize')
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
    isAddingWorker: ['boolean', true, false],
    isRemovingWorker: ['boolean', true, false],
    areLogsPinned: ['boolean', true, false],
    shouldShowTimes: ['boolean', true, true],
    areExceptionsPinned: ['boolean', true, false],
    workerCount: ['number', true, 1],
    heapStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading'
      ]
    },
    exceptionsStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading'
      ]
    },
    logsStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading'
      ]
    },
    logs: ['string', true, '']
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

        return total.toFixed(2) + '%'
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
    exceptions: Exceptions,
    snapshots: Snapshots,
    workers: Workers
  },
  initialize: function () {
    // see https://github.com/AmpersandJS/ampersand-state/issues/66
    this.setWorkerCount()
    this.workers.on('add remove change', this.setWorkerCount.bind(this))
  },
  setWorkerCount: function () {
    this.set('workerCount', this.workers.length)
  }
})
