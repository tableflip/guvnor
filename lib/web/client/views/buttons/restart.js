var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./restart.hbs'),
  bindings: {
    'model.isRestarting': [{
      type: 'booleanClass',
      no: 'fa-refresh',
      selector: '[data-hook=restart-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=restart-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=restart-process-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=restart-process-button]'
    }]
  },
  events: {
    'click [data-hook=restart-process-button]': 'restartProcess'
  },
  restartProcess: function (event) {
    event.target.blur()

    this.model.isRestarting = true

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
        $.ajax({
          url: this.model.collection.parent.url + '/processes/' + this.model.name,
          type: 'PATCH',
          xhrFields: {
            withCredentials: true
          },
          data: {
            status: 'start'
          },
          success: function () {
            this.model.isRestarting = false

            notify({
              header: 'Restart complete',
              message: ['%s on %s restarted', this.model.name, this.model.collection.parent.name],
              type: 'success'
            })
          }.bind(this),
          error: function (error) {
            this.model.isRestarting = false

            notify({
              header: 'Restart error',
              message: ['%s on %s failed to restart - %s', this.model.name, this.model.collection.parent.name, error.message],
              type: 'danger'
            })
          }.bind(this)
        })
      }.bind(this),
      error: function (error) {
        this.model.isRestarting = false

        notify({
          header: 'Restart error',
          message: ['%s on %s failed to stop while restarting - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
