var Collection = require('ampersand-rest-collection')
var Process = require('./process')
var config = require('clientconfig')

module.exports = Collection.extend({
  url: function () {
    return this.parent.url + '/processes'
  },
  ajaxConfig: {
    xhrFields: {
      withCredentials: true
    }
  },
  model: Process,
  addOrUpdate: function (processInfo) {
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

    if (isNew) {
      process.logs.fetch()
      process.exceptions.fetch()
      process.snapshots.fetch()
    }

    if (usage.cpu !== undefined) {
      this._addDataPoint(usage, 'cpu', process)
    }

    if (usage.residentSize !== undefined) {
      this._addDataPoint(usage, 'residentSize', process)
    }

    if (usage.heapTotal !== undefined) {
      this._addDataPoint(usage, 'heapTotal', process)
    }

    if (usage.heapUsed !== undefined) {
      this._addDataPoint(usage, 'heapUsed', process)
    }

    if (usage.latency !== undefined) {
      this._addDataPoint(usage, 'latency', process)
    }

    // make sure we show workers in the main list
    if (processInfo.workers) {
      processInfo.workers.forEach(function (worker) {
        worker.clusterManager = processInfo.id

        this.addOrUpdate(worker)
      }.bind(this))
    }

    process.trigger('update')
  },

  _addDataPoint: function (usage, prop, process) {
    if (usage[prop] !== undefined) {
      var list = process[prop]

      var url = '/hosts/' + process.collection.parent.name + '/processes/' + process.id + '/' + prop

      if (list.length === 0) {
        window.$.ajax({
          url: url,
          settings: {
            dataType: 'json'
          }
        }).success(function (url, data) {
          data.forEach(function (datum) {
            list.push(datum)
          })

          list.sort(function (a, b) {
            if (a.x < b.x) {
              return -1
            }

            if (a.x > b.x) {
              return 1
            }

            return 0
          })
        }.bind(this, url))
      }

      if (list.length === 0 || list[list.length - 1].x < this.parent.time) {
        // only add resource stat if it's more recent than the last entry
        // (the ajax request above can return data more recent than the last
        // event from the web socket)
        list.push({
          x: this.parent.time,
          y: usage[prop]
        })
      }

      if (list.length > config.dataPoints) {
        list.splice(0, list.length - config.dataPoints)
      }
    }
  }
})
