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
    'click [data-hook=startbutton]': 'startApp',
    'click [data-hook=removebutton]': 'removeApp',
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
  removeApp: function (event) {
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

    return


    event.target.blur()

    App.socket.emit('app:lsrefs', {
      host: this.model.collection.parent.name,
      name: this.model.name
    }, function (error, refs) {
      if (error) {
        notify({
          header: 'Set ref error',
          message: ['Could not get list of available refs for %s - %s', this.model.name, error.message],
          type: 'danger'
        })

        return
      }

      this.model.refs = refs

      var form = new SetRefForm({
        model: this.model
      })
      form.onCancel = App.modal.dismiss.bind(App.modal)
      form.onSubmit = this._setRef.bind(this)

      App.modal.reset()
      App.modal.setTitle('Set ref')
      App.modal.setContent(form)
      App.modal.setShowButtons(false)
      App.modal.show()
    }.bind(this))
  },
  _setRef: function (data) {
    /*
    var installation = new Installation({
      name: data.name,
      url: data.url
    })

    App.modal.reset()
    App.modal.setTitle('Setting ref')
    App.modal.setOkText('Hide')
    App.modal.setShowCancel(false)
    App.modal.setContent(new ConsoleView({
      model: installation
    }))
    App.modal.show()

    App.socket.on('ws:setref:info', function (line) {
      installation.logs.add({
        message: line,
        type: 'info',
        date: Date.now()
      })
    })
    App.socket.on('ws:setref:error', function (line) {
      installation.logs.add({
        message: line,
        type: 'error',
        date: Date.now()
      })
    })

    App.socket.emit('app:setref', {
      host: this.model.collection.parent.name,
      name: this.model.name,
      ref: data.ref
    }, function (error) {
      App.socket.removeAllListeners('ws:setref:info')
      App.socket.removeAllListeners('ws:setref:error')
      App.modal.dismiss()

      if (error) {
        notify({
          header: 'Set ref error',
          message: ['%s has failed to set ref - %s', this.model.name, error.message],
          type: 'danger'
        })
      } else {
        this.model.ref = data.ref

        notify({
          header: 'App set ref',
          message: ['%s is now at ref %s', this.model.name, this.model.ref],
          type: 'success'
        })
      }
    }.bind(this))*/
  }
})
