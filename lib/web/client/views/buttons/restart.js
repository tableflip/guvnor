var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var app = require('ampersand-app')

module.exports = View.extend({
  template: require('./restart.hbs'),
  bindings: {
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
    }]
  },
  events: {
    'click [data-hook=restartbutton]': 'restartProcess'
  },
  restartProcess: function (event) {
    event.target.blur()

    this.model.isRestarting = true

    app.socket.emit('process:restart', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      this.model.isRestarting = false

      if (error) {
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
  }
})
