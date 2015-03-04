var ProcessPage = require('../process')
var templates = require('../../templates')
var notify = require('../../helpers/notification')
var _ = require('underscore')

module.exports = ProcessPage.extend({
  template: templates.pages.process.unresponsive,
  bindings: _.extend({
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
  }, ProcessPage.prototype.bindings),
  events: {
    'click [data-hook=debugbutton]': 'debugProcess',
    'click [data-hook=restartbutton]': 'restartProcess',
    'click [data-hook=stopbutton]': 'stopProcess'
  },
  debugProcess: function (event) {
    event.target.blur()

    window.open('http://' +
      this.model.collection.parent.host +
    ':' +
      this.model.collection.parent.debuggerPort +
    '/debug?port=' +
      this.model.debugPort
    )
  },
  restartProcess: function (event) {
    event.target.blur()

    this.model.isRestarting = true

    window.app.socket.emit('process:restart', {
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
