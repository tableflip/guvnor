var View = require('ampersand-view')
var templates = require('../templates')
var notify = require('../helpers/notification')

module.exports = View.extend({
  template: templates.buttons.snapshot,
  bindings: {
    'model.isHeapDump': [{
      type: 'booleanClass',
      no: 'fa-bar-chart',
      selector: '[data-hook=snapshotbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=snapshotbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=snapshotbutton] i'
    }, {
      type: function (el) {
        if (!this.model.isRunning) {
          el.disabled = true

          return
        }

        el.disabled = this.model.isHeapDump
      },
      selector: '[data-hook=snapshotbutton]'
    }],
    'model.isRunning': {
      type: function (el) {
        if (!this.model.isRunning) {
          el.disabled = true

          return
        }

        el.disabled = this.model.isHeapDump
      },
      selector: '[data-hook=snapshotbutton]'
    }
  },
  events: {
    'click [data-hook=snapshotbutton]': 'snapshotProcess'
  },
  snapshotProcess: function (event) {
    event.target.blur()

    this.model.isHeapDump = true

    window.app.socket.emit('process:heapdump', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      this.model.isHeapDump = false

      if (error) {
        notify({
          header: 'Snapshot error',
          message: ['%s on %s has failed to take a heap snapshot - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Snapshot complete',
          message: ['%s on %s has taken a heap snapshot', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  }
})
