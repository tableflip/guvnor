var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var AlertView = require('../../../alert')
var AlertModel = require('../../../../models/alert')
var SetRefView = require('./choose-ref')
var OutputModel = require('../../../../models/output')
var ResultView = require('../result')
var App = require('ampersand-app')

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.refsStatus': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        if (this.model.refsStatus === 'loading') {
          this.switcher.set(new AlertView({
            model: new AlertModel({
              type: 'info',
              indeterminate: true,
              title: 'Loading refs',
              message: 'Loading refs for ' + this.model.name
            })
          }))
        } else if (this.model.refsStatus === 'error-loading') {
          this.switcher.set(new AlertView({
            model: new AlertModel({
              type: 'danger',
              title: 'Could not load apps',
              message: 'Could not load apps for ' + this.model.name
            })
          }))
        } else if (this.model.refsStatus === 'loaded') {
          this.showChooseRefForm()
        }
      }
    }
  },
  render: function () {
    this.renderWithTemplate()

    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))

    this.model.refsStatus = 'loading'

    this.model.refs.fetch({
      success: this.model.set.bind(this.model, 'refsStatus', 'loaded'),
      error: this.model.set.bind(this.model, 'refsStatus', 'error-loading'),
      merge: true
    })
  },
  showChooseRefForm: function () {
    this.switcher.set(new SetRefView({
      model: this.model,
      onSubmit: this.setRef.bind(this)
    }))
  },
  setRef: function (data) {
    var request = new window.XMLHttpRequest()
    var outputModel = new OutputModel()
    outputModel.preview = 'Setting ref to ' + data.ref

    var resultView = new ResultView({
      request: request,
      model: outputModel,
      onBack: this.showChooseRefForm.bind(this),
      onDone: App.router.redirectTo.bind(App.router, '/host/' + this.model.collection.parent.name + '/apps'),
      onSuccess: function (app) {
        for (var key in app) {
          this.model.set(key, app[key])
        }

        outputModel.successHeader = 'Switch ref complete'
        outputModel.successMessage = 'Switched ' + this.model.name + ' to ' + this.model.ref.name
      }.bind(this)
    })

    this.switcher.set(resultView)

    request.open('PATCH', this.model.collection.parent.url + '/apps/' + this.model.name, true)
    request.setRequestHeader('Content-Type', 'application/json')
    request.send(JSON.stringify(data))
  }
})
