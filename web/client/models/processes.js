var Collection = require('ampersand-collection'),
  Process = require('./process');

module.exports = Collection.extend({
  model: Process,
  addOrUpdate: function(processInfo) {
    var usage = {
      cpu: processInfo.cpu,
      residentSize: processInfo.residentSize,
      heapTotal: processInfo.heapTotal,
      heapUsed: processInfo.heapUsed,
      latency: processInfo.latency
    }

    // remove values as they conflict with collections on model
    delete processInfo.cpu
    delete processInfo.residentSize
    delete processInfo.heapTotal
    delete processInfo.heapUsed
    delete processInfo.latency

    var isNew = !this.get(processInfo.id)

    // fetch any existing logs/exceptions and usage information
    var process = this.add(processInfo, {
      merge: true
    })

    if(isNew) {
      process.logs.fetch()
      process.exceptions.fetch()
      process.cpu.fetch()
      process.residentSize.fetch()
      process.heapTotal.fetch()
      process.heapUsed.fetch()
      process.latency.fetch()
    }

    if(usage.cpu !== undefined) {
      process.cpu.add({
        date: this.parent.time,
        usage: usage.cpu
      }, {
        sort: process.cpu.length > 0 && this.parent.time > process.cpu.at(process.cpu.length - 1).date
      })
    }

    if(usage.residentSize !== undefined) {
      process.residentSize.add({
        date: this.parent.time,
        usage: usage.residentSize
      }, {
        sort: process.residentSize.length > 0 && this.parent.time > process.residentSize.at(process.residentSize.length - 1).date
      })
    }

    if(usage.heapTotal !== undefined) {
      process.heapTotal.add({
        date: this.parent.time,
        usage: usage.heapTotal
      }, {
        sort: process.heapTotal.length > 0 && this.parent.time > process.heapTotal.at(process.heapTotal.length - 1).date
      })
    }

    if(usage.heapUsed !== undefined) {
      process.heapUsed.add({
        date: this.parent.time,
        usage: usage.heapUsed
      }, {
        sort: process.heapUsed.length > 0 && this.parent.time > process.heapUsed.at(process.heapUsed.length - 1).date
      })
    }

    if(usage.latency !== undefined) {
      process.latency.add({
        date: this.parent.time,
        usage: usage.latency
      }, {
        sort: process.latency.length > 0 && this.parent.time > process.latency.at(process.latency.length - 1).date
      })
    }

    // make sure we show workers in the main list
    if(processInfo.workers) {
      processInfo.workers.forEach(function(worker) {
        worker.clusterManager = processInfo.id

        this.addOrUpdate(worker)
      }.bind(this))
    }
  }
})
