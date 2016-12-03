var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./snapshot.hbs'),
  bindings: {
    'model.isHeapDump': [{
      type: 'booleanClass',
      no: 'fa-bar-chart',
      selector: '[data-hook=snapshot-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=snapshot-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=snapshot-process-button] i'
    }, {
      type: function (el) {
        if (!this.model.isRunning) {
          el.disabled = true

          return
        }

        el.disabled = this.model.isHeapDump
      },
      selector: '[data-hook=snapshot-process-button]'
    }],
    'model.isRunning': {
      type: function (el) {
        if (!this.model.isRunning) {
          el.disabled = true

          return
        }

        el.disabled = this.model.isHeapDump
      },
      selector: '[data-hook=snapshot-process-button]'
    }
  },
  events: {
    'click [data-hook=snapshot-process-button]': 'snapshotProcess'
  },
  snapshotProcess: function (event) {
    event.target.blur()

    this.model.isHeapDump = true

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name + '/heapsnapshots',
      type: 'POST',
      xhrFields: {
        withCredentials: true
      },
      success: function () {
        this.model.isHeapDump = false
        this.model.snapshots.fetch()

        notify({
          header: 'Snapshot complete',
          message: ['%s on %s has taken a heap snapshot', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }.bind(this),
      error: function (error) {
        this.model.isHeapDump = false

        notify({
          header: 'Snapshot error',
          message: ['%s on %s has failed to take a heap snapshot - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
