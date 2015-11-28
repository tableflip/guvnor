var App = require('ampersand-app')
var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var AppView = require('./app')
var NoAppsView = require('./empty')
var Installation = require('../../../models/installation')
var InstallView = require('./install')
var ConsoleView = require('./console')
var notify = require('../../../helpers/notification')

module.exports = View.extend({
  template: require('./list.hbs'),
  subviews: {
    apps: {
      container: '[data-hook=apps]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.apps,
          view: AppView,
          emptyView: NoAppsView
        })
      }
    }
  },
  events: {
    'click [data-hook=installbutton]': 'installApp'
  },
  installApp: function (event) {
    event.target.blur()

    //this.model.appsStatus = 'install'

    App.router.redirectTo('/host/' + this.model.name + '/apps/install')

    return

    var host = this.model
    var form = new InstallView()
    form.onCancel = function () {
      app.modal.dismiss()
    }
    form.onSubmit = function (data) {
      var installation = new Installation({
        name: data.name,
        url: data.url
      })

      app.modal.reset()
      app.modal.setTitle('Install app')
      app.modal.setOkText('Hide')
      app.modal.setShowCancel(false)
      app.modal.setContent(new ConsoleView({
        model: installation
      }))

      app.socket.on('ws:appinstall:info', function (line) {
        installation.logs.add({
          message: line,
          type: 'info',
          date: Date.now()
        })
      })
      app.socket.on('ws:appinstall:error', function (line) {
        installation.logs.add({
          message: line,
          type: 'error',
          date: Date.now()
        })
      })

      app.socket.emit('app:install', {
        host: host.name,
        name: data.name,
        url: data.url
      }, function (error) {
        app.socket.removeAllListeners('ws:appinstall:info')
        app.socket.removeAllListeners('ws:appinstall:error')
        app.modal.dismiss()

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

    app.modal.reset()
    app.modal.setTitle('Install app')
    app.modal.setContent(form)
    app.modal.setShowButtons(false)
    app.modal.show()
  }
})
