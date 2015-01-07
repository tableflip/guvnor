var View = require('ampersand-view'),
  templates = require('../../../templates'),
  notify = require('../../../helpers/notification')

module.exports = View.extend({
  template: templates.includes.process.overview.running,
  bindings: {
    'model.pid': '[data-hook=pid]',
    'model.user': '[data-hook=user]',
    'model.group': '[data-hook=group]',
    'model.uptimeFormatted': '[data-hook=uptime]',
    'model.restarts': '[data-hook=restarts]',
    'model.isPaused': {
      type: 'toggle',
      yes: '[data-hook=debugger-warning]',
      no: '[data-hook=running-information]'
    },
    'model.isGc': [{
      type: 'booleanClass',
      no: 'fa-trash',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=gcbutton]'
    }],
    'model.isHeapDump': [{
      type: 'booleanClass',
      no: 'fa-h-square',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=heapdumpbutton]'
    }],
    'model.isRestarting': [{
      type: 'booleanClass',
      no: 'fa-refresh',
      selector: '[data-hook=restartbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=restartbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=restartbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=restartbutton]'
    }],
    'model.isStopping': [{
      type: 'booleanClass',
      no: 'fa-stop',
      selector: '[data-hook=stopbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=stopbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=stopbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=stopbutton]'
    }]
  },
  events: {
    'click button.process-gc': 'garbageCollectProcess',
    'click button.process-heap': 'heapDumpProcess',
    'click button.process-debug': 'debugProcess',
    'click [data-hook=restartbutton]': 'restartProcess',
    'click button.process-stop': 'stopProcess',
    'click button.process-addworker': 'addWorkerToCluster',
    'click button.process-removeworker': 'removeWorkerFromCluster'
  },
  garbageCollectProcess: function(event) {
    event.target.blur()

    this.model.isGc = true

    window.app.socket.emit('process:gc', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error) {
      this.model.isGc = false

      if(error) {
        notify({
          header: 'Garbage collection error',
          message: ['%s on %s has failed to collect garbage - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Garbage collection complete',
          message: ['%s on %s has collected garbage', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  },
  heapDumpProcess: function(event) {
    event.target.blur()

    this.model.isHeapDump = true

    window.app.socket.emit('process:heapdump', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error, path) {
      this.model.isHeapDump = false

      if(error) {
        notify({
          header: 'Heap dump error',
          message: ['%s on %s has failed to dump heap - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Heap dump complete',
          message: ['%s on %s has dumped heap to %s', this.model.name, this.model.collection.parent.name, path],
          type: 'success'
        })
      }
    }.bind(this))
  },
  debugProcess: function(event) {
    event.target.blur()

    window.open('http://' +
      this.model.collection.parent.host +
      ':' +
      this.model.collection.parent.debuggerPort +
      '/debug?port=' +
      this.model.debugPort
    )
  },
  restartProcess: function(event) {
    event.target.blur()

    this.model.isRestarting = true

    window.app.socket.emit('process:restart', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error) {
      this.model.isRestarting = false

      if(error) {
        notify({
          header: 'Restart error',
          message: ['%s on %s failed to restart - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Restart complete',
          message: ['%s on %s restarted', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  },
  stopProcess: function(event) {
    event.target.blur()

    this.model.isStopping = true

    window.app.socket.emit('process:stop', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error) {
      this.model.isStopping = false

      if(error) {
        notify({
          header: 'Stop error',
          message: ['%s on %s has failed to stop - %s', this.model.name, this.model.collection.parent.name, error.message || error.code],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Process stopped',
          message: ['%s on %s stopped', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  },
  addWorkerToCluster: function(event) {
    event.target.blur()

    window.app.socket.emit('cluster:addworker', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error) {
      if(error) {
        notify({
          header: 'Add worker error',
          message: ['Could not add a worker to %s on %s - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }
    }.bind(this))
  },
  removeWorkerFromCluster: function(event) {
    event.target.blur()

    window.app.socket.emit('cluster:removeworker', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function(error) {
      if(error) {
        notify({
          header: 'Remove worker error',
          message: ['Could not remove a worker from %s on %s - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }
    }.bind(this))
  }
})
