var View = require('ampersand-view')
var templates = require('../templates')
var notify = require('../helpers/notification')

module.exports = View.extend({
  template: templates.buttons.stop,
  bindings: {
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
    'click [data-hook=stopbutton]': 'stopProcess'
  },
  stopProcess: function (event) {
    event.target.blur()

    this.model.isStopping = true

    window.app.socket.emit('process:stop', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      this.model.isStopping = false

      if (error) {
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
  }
})
