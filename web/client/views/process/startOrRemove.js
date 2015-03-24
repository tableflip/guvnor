var View = require('ampersand-view')
var templates = require('../../templates')
var ConfirmView = require('../../views/confirm')
var StartView = require('../../views/process/start')
var notify = require('../../helpers/notification')

module.exports = View.extend({
  template: templates.includes.process.startOrRemove,
  bindings: {
    'model.isStarting': [{
      type: 'booleanClass',
      no: 'fa-play',
      selector: '[data-hook=startbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=startbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=startbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=startbutton]'
    }],
    'model.isRemoving': [{
      type: 'booleanClass',
      no: 'fa-remove',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=removebutton]'
    }]
  },
  events: {
    'click button.process-start': 'startProcess',
    'click button.process-remove': 'removeProcess'
  },
  startProcess: function (event) {
    event.target.blur()

    var form = new StartView({
      model: this.model
    })
    form.onCancel = function () {
      window.app.modal.dismiss()
    }
    form.onSubmit = function (data) {
      this.model.isStarting = true
      window.app.modal.dismiss()

      window.app.socket.emit('process:start', {
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
        window.app.navigate('/host/' + this.model.collection.parent.name + '/process/' + processInfo.id)
      }.bind(this))
    }.bind(this)

    window.app.modal.reset()
    window.app.modal.setTitle('Start ' + this.model.name)
    window.app.modal.setContent(form)
    window.app.modal.setIsDanger(false)
    window.app.modal.setShowButtons(false)
    window.app.modal.show()
  },
  removeProcess: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this process? This action cannot be undone.')

    window.app.modal.reset()
    window.app.modal.setTitle('Danger zone!')
    window.app.modal.setContent(confirmView)
    window.app.modal.setIsDanger(true)
    window.app.modal.setOkText('Remove')
    window.app.modal.setCallback(function () {
      this.model.isRemoving = true

      window.app.socket.emit('process:remove', {
        host: this.model.collection.parent.name,
        process: this.model.id
      }, function () {
      })
    }.bind(this))
    window.app.modal.show()
  }
})
