var Collection = require('ampersand-collection'),
  Process = require('./process');

module.exports = Collection.extend({
  model: Process,
  addOrUpdate: function(processInfo) {
    var usage = {
      cpu: processInfo.cpu,
      residentSize: processInfo.residentSize,
      heapTotal: processInfo.heapTotal,
      heapUsed: processInfo.heapUsed
    }

    // remove values as they conflict with collections on model
    delete processInfo.cpu
    delete processInfo.residentSize
    delete processInfo.heapTotal
    delete processInfo.heapUsed

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
    }

    if(usage.cpu !== undefined) {
      process.cpu.add({
        date: this.parent.time,
        usage: usage.cpu
      })
    }

    if(usage.residentSize !== undefined) {
      process.residentSize.add({
        date: this.parent.time,
        usage: usage.residentSize
      })
    }

    if(usage.heapTotal !== undefined) {
      process.heapTotal.add({
        date: this.parent.time,
        usage: usage.heapTotal
      })
    }

    if(usage.heapUsed !== undefined) {
      process.heapUsed.add({
        date: this.parent.time,
        usage: usage.heapUsed
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
