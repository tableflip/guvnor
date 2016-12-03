var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./stop.hbs'),
  bindings: {
    'model.isStopping': [{
      type: 'booleanClass',
      no: 'fa-stop',
      selector: '[data-hook=stop-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=stop-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=stop-process-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=stop-process-button]'
    }]
  },
  events: {
    'click [data-hook=stop-process-button]': 'stopProcess'
  },
  stopProcess: function (event) {
    event.target.blur()

    this.model.isStopping = true

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name,
      type: 'PATCH',
      xhrFields: {
        withCredentials: true
      },
      data: {
        status: 'stop'
      },
      success: function () {
        this.model.isStopping = false

        notify({
          header: 'Process stopped',
          message: ['%s on %s stopped', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }.bind(this),
      error: function (error) {
        this.model.isStopping = false

        notify({
          header: 'Stop error',
          message: ['%s on %s has failed to stop - %s', this.model.name, this.model.collection.parent.name, error.message || error.code],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
