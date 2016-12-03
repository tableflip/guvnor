var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./worker-remove.hbs'),
  bindings: {
    'model.isRemovingWorker': [{
      type: 'booleanClass',
      no: 'fa-minus',
      selector: '[data-hook=remove-worker-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=remove-worker-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=remove-worker-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=remove-worker-button]'
    }],
    'model.workerCount': [{
      type: function (el, value, previousValue) {
        el.disabled = value === 1
      },
      selector: '[data-hook=remove-worker-button]'
    }]
  },
  events: {
    'click [data-hook=remove-worker-button]': 'removeWorkerFromCluster'
  },
  removeWorkerFromCluster: function (event) {
    event.target.blur()

    this.model.isRemovingWorker = true

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name,
      type: 'PATCH',
      xhrFields: {
        withCredentials: true
      },
      data: {
        workers: this.model.workers.length - 1
      },
      success: function () {
        this.model.isRemovingWorker = false

        notify({
          header: 'Remove worker',
          message: ['Removed a worker from %s on %s', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }.bind(this),
      error: function (request, type, message) {
        this.model.isRemovingWorker = false

        notify({
          header: 'Remove worker error',
          message: ['Could not add a worker to %s on %s - %s', this.model.name, this.model.collection.parent.name, message],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
