var View = require('ampersand-view')
var templates = require('../../templates')
var ConfirmView = require('../confirm')
var StartView = require('../process/start')
var notify = require('../../helpers/notification')
var Installation = require('../../models/installation')
var SetRefForm = require('./refs')
var ConsoleView = require('./console')

module.exports = View.extend({
  template: templates.includes.apps.app,
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
      window.app.modal.dismiss()
    }
    form.onSubmit = function (data) {
      this.model.isStarting = true
      window.app.modal.dismiss()

      window.app.socket.emit('app:start', {
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
  removeApp: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this app? This action cannot be undone.')

    window.app.modal.reset()
    window.app.modal.setTitle('Danger zone!')
    window.app.modal.setContent(confirmView)
    window.app.modal.setIsDanger(true)
    window.app.modal.setOkText('Remove')
    window.app.modal.setCallback(function () {
      this.model.isRemoving = true

      window.app.socket.emit('app:remove', {
        host: this.model.collection.parent.name,
        name: this.model.name
      }, function () {})
    }.bind(this))
    window.app.modal.show()
  },
  updateRefs: function (event) {
    event.target.blur()

    var installation = new Installation({
      name: this.model.name,
      url: this.model.url
    })

    window.app.socket.on('ws:appupdate:info', function (line) {
      installation.logs.add({
        message: line,
        type: 'info',
        date: Date.now()
      })
    })
    window.app.socket.on('ws:appupdate:error', function (line) {
      installation.logs.add({
        message: line,
        type: 'error',
        date: Date.now()
      })
    })

    window.app.socket.emit('app:update', {
      host: this.model.collection.parent.name,
      name: this.model.name
    }, function (error) {
      window.app.socket.removeAllListeners('ws:appupdate:info')
      window.app.socket.removeAllListeners('ws:appupdate:error')
      window.app.modal.dismiss()

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

    window.app.modal.reset()
    window.app.modal.setTitle('Updating app refs')
    window.app.modal.setOkText('Hide')
    window.app.modal.setShowCancel(false)
    window.app.modal.setContent(new ConsoleView({
      model: installation
    }))
    window.app.modal.show()
  },
  setRef: function (event) {
    event.target.blur()

    window.app.socket.emit('app:lsrefs', {
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
      form.onCancel = window.app.modal.dismiss.bind(window.app.modal)
      form.onSubmit = this._setRef.bind(this)

      window.app.modal.reset()
      window.app.modal.setTitle('Set ref')
      window.app.modal.setContent(form)
      window.app.modal.setShowButtons(false)
      window.app.modal.show()
    }.bind(this))
  },
  _setRef: function (data) {
    var installation = new Installation({
      name: data.name,
      url: data.url
    })

    window.app.modal.reset()
    window.app.modal.setTitle('Setting ref')
    window.app.modal.setOkText('Hide')
    window.app.modal.setShowCancel(false)
    window.app.modal.setContent(new ConsoleView({
      model: installation
    }))
    window.app.modal.show()

    window.app.socket.on('ws:setref:info', function (line) {
      installation.logs.add({
        message: line,
        type: 'info',
        date: Date.now()
      })
    })
    window.app.socket.on('ws:setref:error', function (line) {
      installation.logs.add({
        message: line,
        type: 'error',
        date: Date.now()
      })
    })

    window.app.socket.emit('app:setref', {
      host: this.model.collection.parent.name,
      name: this.model.name,
      ref: data.ref
    }, function (error) {
      window.app.socket.removeAllListeners('ws:setref:info')
      window.app.socket.removeAllListeners('ws:setref:error')
      window.app.modal.dismiss()

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
