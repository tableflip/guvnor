var App = require('ampersand-app')
var View = require('ampersand-view')
var ConfirmView = require('../../../confirm')
var StartView = require('../../../process/start')
var notify = require('../../../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./app.hbs'),
  bindings: {
    'model.name': '[data-hook=name]',
    'model.user': '[data-hook=user]',
    'model.url': '[data-hook=url]',
    'model.ref.name': '[data-hook=ref]',
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
    'click [data-hook=startbutton]': 'start',
    'click [data-hook=removebutton]': 'remove',
    'click [data-hook=updatebutton]': 'update',
    'click [data-hook=setbutton]': 'setRef'
  },
  startApp: function (event) {
    event.target.blur()

    var form = new StartView({
      model: this.model
    })
    form.onCancel = function () {
      App.modal.dismiss()
    }
    form.onSubmit = function (data) {
      this.model.isStarting = true
      App.modal.dismiss()

      data.user = data.user.name

      App.socket.emit('app:start', {
        host: this.model.collection.parent.name,
        name: this.model.name,
        options: data
      }, function (error, processInfo) {
        this.model.isStarting = false

        if (error) {
          notify({
            header: 'App start failed',
            message: ['%s failed to start on %s - %s', this.model.name || this.model.url, this.model.collection.parent.name, error.message],
            type: 'danger'
          })

          return
        }

        this.model.collection.parent.processes.addOrUpdate(processInfo)
        App.navigate('/host/' + this.model.collection.parent.name + '/process/' + processInfo.id)
      }.bind(this))
    }.bind(this)

    App.modal.reset()
    App.modal.setTitle('Start ' + this.model.name)
    App.modal.setContent(form)
    App.modal.setIsDanger(false)
    App.modal.setShowButtons(false)
    App.modal.show()
  },
  remove: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this app? This action cannot be undone.')

    App.modal.reset()
    App.modal.setTitle('Danger zone!')
    App.modal.setContent(confirmView)
    App.modal.setIsDanger(true)
    App.modal.setOkText('Remove')
    App.modal.setCallback(function () {
      this.model.isRemoving = true

      var host = this.model.collection.parent

      $.ajax({
        url: host.url + '/apps/' + this.model.name,
        type: 'DELETE',
        success: function () {
          this.model.isRemoving = false

          notify({
            header: 'App removed',
            message: ['%s was removed from %s', this.model.name, host.name]
          })

          this.model.collection.remove(this.model)
        }.bind(this),
        error: function (request, type, error) {
          this.model.isRemoving = false

          notify({
            header: 'Error removing app',
            message: ['Failed to remove %s from %s - %s', this.model.name, host.name, error],
            type: 'danger'
          })
        }.bind(this)
      })
    }.bind(this))
    App.modal.show()
  },
  update: function (event) {
    event.target.blur()

    App.router.redirectTo('/host/' + this.model.collection.parent.name + '/apps/' + this.model.name + '/update')
  },
  setRef: function (event) {
    event.target.blur()

    App.router.redirectTo('/host/' + this.model.collection.parent.name + '/apps/' + this.model.name + '/set-ref')
  },
  start: function (event) {
    event.target.blur()

    App.router.redirectTo('/host/' + this.model.collection.parent.name + '/apps/' + this.model.name + '/start')
  }
})
