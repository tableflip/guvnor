var app = require('ampersand-app')
var View = require('ampersand-view')
var ConfirmView = require('../../confirm')
var StartView = require('../../process/start')
var notify = require('../../../helpers/notification')
var Installation = require('../../../models/installation')
var SetRefForm = require('./refs')
var ConsoleView = require('./console')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./app.hbs'),
  bindings: {
    'model.name': '[data-hook=name]',
    'model.user': '[data-hook=user]',
    'model.url': '[data-hook=url]',
    'model.ref': '[data-hook=ref]',
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
    }],
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
    }]
  },
  events: {
    'click [data-hook=startbutton]': 'startApp',
    'click [data-hook=removebutton]': 'removeApp',
    'click [data-hook=updatebutton]': 'updateRefs',
    'click [data-hook=setbutton]': 'setRef'
  },
  startApp: function (event) {
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

      data.user = data.user.name

      app.socket.emit('app:start', {
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
        app.navigate('/host/' + this.model.collection.parent.name + '/process/' + processInfo.id)
      }.bind(this))
    }.bind(this)

    app.modal.reset()
    app.modal.setTitle('Start ' + this.model.name)
    app.modal.setContent(form)
    app.modal.setIsDanger(false)
    app.modal.setShowButtons(false)
    app.modal.show()
  },
  removeApp: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this app? This action cannot be undone.')

    app.modal.reset()
    app.modal.setTitle('Danger zone!')
    app.modal.setContent(confirmView)
    app.modal.setIsDanger(true)
    app.modal.setOkText('Remove')
    app.modal.setCallback(function () {
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
    app.modal.show()
  },
  updateRefs: function (event) {
    event.target.blur()

    var installation = new Installation({
      name: this.model.name,
      url: this.model.url
    })

    app.socket.on('ws:appupdate:info', function (line) {
      installation.logs.add({
        message: line,
        type: 'info',
        date: Date.now()
      })
    })
    app.socket.on('ws:appupdate:error', function (line) {
      installation.logs.add({
        message: line,
        type: 'error',
        date: Date.now()
      })
    })

    app.socket.emit('app:update', {
      host: this.model.collection.parent.name,
      name: this.model.name
    }, function (error) {
      app.socket.removeAllListeners('ws:appupdate:info')
      app.socket.removeAllListeners('ws:appupdate:error')
      app.modal.dismiss()

      if (error) {
        notify({
          header: 'Update error',
          message: ['%s on %s has failed to update - %s', installation.name || installation.url, this.model.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'App updated',
          message: ['%s was updated on %s', installation.name || installation.url, this.model.name],
          type: 'success'
        })
      }
    }.bind(this))

    app.modal.reset()
    app.modal.setTitle('Updating app refs')
    app.modal.setOkText('Hide')
    app.modal.setShowCancel(false)
    app.modal.setContent(new ConsoleView({
      model: installation
    }))
    app.modal.show()
  },
  setRef: function (event) {
    event.target.blur()

    app.socket.emit('app:lsrefs', {
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
      form.onCancel = app.modal.dismiss.bind(app.modal)
      form.onSubmit = this._setRef.bind(this)

      app.modal.reset()
      app.modal.setTitle('Set ref')
      app.modal.setContent(form)
      app.modal.setShowButtons(false)
      app.modal.show()
    }.bind(this))
  },
  _setRef: function (data) {
    var installation = new Installation({
      name: data.name,
      url: data.url
    })

    app.modal.reset()
    app.modal.setTitle('Setting ref')
    app.modal.setOkText('Hide')
    app.modal.setShowCancel(false)
    app.modal.setContent(new ConsoleView({
      model: installation
    }))
    app.modal.show()

    app.socket.on('ws:setref:info', function (line) {
      installation.logs.add({
        message: line,
        type: 'info',
        date: Date.now()
      })
    })
    app.socket.on('ws:setref:error', function (line) {
      installation.logs.add({
        message: line,
        type: 'error',
        date: Date.now()
      })
    })

    app.socket.emit('app:setref', {
      host: this.model.collection.parent.name,
      name: this.model.name,
      ref: data.ref
    }, function (error) {
      app.socket.removeAllListeners('ws:setref:info')
      app.socket.removeAllListeners('ws:setref:error')
      app.modal.dismiss()

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
    }.bind(this))
  }
})
