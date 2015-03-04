var HostPage = require('../host')
var templates = require('../../templates')
var CollectionRenderer = require('ampersand-collection-view')
var AppView = require('../../views/apps/app')
var Installation = require('../../models/installation')
var InstallView = require('../../views/apps/install')
var InstallingView = require('../../views/apps/installing')
var notify = require('../../helpers/notification')

module.exports = HostPage.extend({
  template: templates.pages.host.apps,
  initialize: function () {
    HostPage.prototype.initialize.call(this)

    this.listenTo(this.model.apps, 'add remove', function () {
      if (this.model.apps.length <= 1) {
        // if length == 1 then the list used to be empty so call render to remove
        // the 'nothing to show' message and show the list instead
        this.render()
      }
    })
  },
  subviews: {
    apps: {
      container: '[data-hook=apps]',
      prepareView: function (el) {
        return new CollectionRenderer({
            el: el,
            collection: this.model.apps,
            view: AppView
          })
      }
    }
  },
  bindings: {
    'model.apps.length': {
      type: 'toggle',
      no: '[data-hook=no-apps]',
      yes: '[data-hook=apps-list]'
    }
  },
  events: {
    'click [data-hook=installbutton]': 'installApp'
  },
  installApp: function (event) {
    event.target.blur()

    var host = this.model
    var form = new InstallView()
    form.onCancel = function () {
      window.app.modal.dismiss()
    }
    form.onSubmit = function (data) {
      var installation = new Installation({
        name: data.name,
        url: data.url
      })

      window.app.modal.reset()
      window.app.modal.setTitle('Install app')
      window.app.modal.setOkText('Hide')
      window.app.modal.setShowCancel(false)
      window.app.modal.setContent(new InstallingView({
        model: installation
      }))

      window.app.socket.on('ws:appinstall:info', function (line) {
        installation.logs.add({
          message: line,
          type: 'info',
          date: Date.now()
        })
      })
      window.app.socket.on('ws:appinstall:error', function (line) {
        installation.logs.add({
          message: line,
          type: 'error',
          date: Date.now()
        })
      })

      window.app.socket.emit('app:install', {
        host: host.name,
        name: data.name,
        url: data.url
      }, function (error) {
          window.app.socket.removeAllListeners('ws:appinstall:info')
          window.app.socket.removeAllListeners('ws:appinstall:error')
          window.app.modal.dismiss()

          if (error) {
            notify({
              header: 'Install error',
              message: ['%s on %s has failed to install - %s', installation.name || installation.url, host.name, error.message],
              type: 'danger'
            })
          } else {
            notify({
              header: 'App installed',
              message: ['%s was installed on %s', installation.name || installation.url, host.name],
              type: 'success'
            })
          }
        })
    }

    window.app.modal.reset()
    window.app.modal.setTitle('Install app')
    window.app.modal.setContent(form)
    window.app.modal.setShowButtons(false)
    window.app.modal.show()
  }
})
