var View = require('ampersand-view')
var StartView = require('../process/start')
var notify = require('../../helpers/notification')
var app = require('ampersand-app')

module.exports = View.extend({
  template: require('./start.hbs'),
  bindings: {
    'model.isStarting': [{
      type: 'booleanClass',
      no: 'fa-play',
      selector: '[data-hook=start-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=start-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=start-process-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=start-process-button]'
    }]
  },
  events: {
    'click [data-hook=start-process-button]': 'startProcess'
  },
  startProcess: function (event) {
    event.target.blur()

    var form = new StartView({
      model: this.model
    })
    form.onCancel = function () {
      app.modal.dismiss()
    }
    form.onSubmit = function (data) {
      this.model.isStarting = true
      app.modal.dismiss()

      app.socket.emit('process:start', {
        host: this.model.collection.parent.name,
        name: this.model.name,
        options: data
      }, function (error, processInfo) {
        this.model.isStarting = false

        if (error) {
          notify({
            header: 'Process start failed',
            message: ['%s failed to start on %s - %s', this.model.name || this.model.url, this.model.collection.parent.name, error.message],
            type: 'danger'
          })

          return
        }

        this.model.collection.parent.processes.addOrUpdate(processInfo)
        app.navigate('/host/' + this.model.collection.parent.name + '/process/' + processInfo.id)
      }.bind(this))
    }.bind(this)

    app.modal.reset()
    app.modal.setTitle('Start ' + this.model.name)
    app.modal.setContent(form)
    app.modal.setIsDanger(false)
    app.modal.setShowButtons(false)
    app.modal.show()
  }
})
