var AmpersandModel = require('ampersand-model'),
  config = require('clientconfig'),
  moment = require('moment'),
  prettysize = require('prettysize'),
  Processes = require('./processes'),
  Apps = require('./apps')

module.exports = AmpersandModel.extend({
  idAttribute: 'name',
  props: {
    name: 'string',
    lastUpdated: 'date',
    status: {
      type: 'string',
      values: [
        'connecting', 'connected', 'connectionrefused', 'connectionreset',
        'hostnotfound', 'connectiontimedout', 'error', 'incompatible',
        'timeout', 'badsignature', 'networkdown']
    },
    host: 'string', // this is set from config
    hostname: 'string', // this is set from os.hostname()
    type: 'string',
    platform: 'string',
    arch: 'string',
    release: 'string',
    version: 'string',
    time: 'number',
    uptime: 'number',
    freeMemory: 'number',
    totalMemory: 'number',
    debuggerPort: 'number',
    users: ['array', true, function() { return []}],
    groups: ['array', true, function() { return []}],
    cpus: ['array', true, function() {
      return {
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
      }
    }]
  },
  session: {
    selected: ['boolean', true, false],
    selectedProcess: ['any', false, null]
  },
  derived: {
    timeFormatted: {
      deps: ['time'],
      fn: function () {
        return moment(this.time).format("YYYY-MM-DD HH:mm:ss Z")
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
        if(!this.cpus[0]) {
          return ''
        }

        return this.cpus.length + 'x ' + (this.cpus[0].speed/1000).toFixed(2) + 'GHz'
      }
    },
    usedMemory: {
      deps: ['freeMemory', 'totalMemory'],
      fn: function() {
        return ~~(((this.totalMemory - this.freeMemory) / this.totalMemory) * 100)
      }
    },
    totalMemoryFormatted: {
      deps: ['totalMemory'],
      fn: function () {
        return prettysize(this.totalMemory, true)
      }
    }
  },
  collections: {
    processes: Processes,
    apps: Apps
  }
})
