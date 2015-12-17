var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./worker-add.hbs'),
  bindings: {
    'model.isAddingWorker': [{
      type: 'booleanClass',
      no: 'fa-plus',
      selector: '[data-hook=button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=button]'
    }],
    'model.workerCount': [{
      type: function (el, value, previousValue) {
        el.disabled = value === this.model.collection.parent.cpus.length
      },
      selector: '[data-hook=button]'
    }]
  },
  events: {
    'click [data-hook=button]': 'addWorkerToCluster'
  },
  addWorkerToCluster: function (event) {
    event.target.blur()

    this.model.isAddingWorker = true

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name,
      type: 'PATCH',
      data: {
        workers: this.model.workers.length + 1
      },
      success: function () {
        this.model.isAddingWorker = false

        notify({
          header: 'Add worker error',
          message: ['Added a worker to %s on %s', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }.bind(this),
      error: function (request, type, message) {
        this.model.isAddingWorker = false

        notify({
          header: 'Add worker error',
          message: ['Could not add a worker to %s on %s - %s', this.model.name, this.model.collection.parent.name, message],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
