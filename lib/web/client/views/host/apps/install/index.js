var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var Model = require('ampersand-model')
var App = require('ampersand-app')
var InstallView = require('./install')
var ResultView = require('../result')
var OutputModel = require('../../../../models/output')

var AppModel = Model.extend({
  props: {
    name: 'string',
    url: 'string'
  }
})

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  initialize: function () {
    this.app = new AppModel()
  },
  render: function () {
    this.renderWithTemplate()
    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))
    this.showInstallForm()
  },
  showInstallForm: function () {
    this.switcher.set(new InstallView({
      model: this.app,
      onSubmit: this.install.bind(this),
      onCancel: App.router.redirectTo.bind(App.router, '/host/' + this.model.name + '/apps')
    }))
  },
  install: function (data) {
    if (!data.name) {
      delete data.name
    }

    this.app.name = data.name
    this.app.url = data.url

    var request = new window.XMLHttpRequest()
    var outputModel = new OutputModel()
    outputModel.preview = 'Installing ' + (data.name ? data.name + ' from ' : '') + data.url

    var resultView = new ResultView({
      request: request,
      model: outputModel,
      onBack: this.showInstallForm.bind(this),
      onDone: App.router.redirectTo.bind(App.router, '/host/' + this.model.name + '/apps'),
      onSuccess: function (app) {
        this.app.name = app.name

        outputModel.successHeader = 'Installation complete'
        outputModel.successMessage = 'Installed ' + app.name
      }.bind(this)
    })

    this.switcher.set(resultView)

    request.open('post', this.model.url + '/apps', true)
    request.setRequestHeader('Content-Type', 'application/json')
    request.send(JSON.stringify(data))
  }
})
