var View = require('ampersand-view')
var App = require('ampersand-app')
var ResultView = require('../result')
var OutputModel = require('../../../../models/output')

module.exports = View.extend({
  template: '<div data-hook="holder"></div>',
  render: function () {
    this.renderWithTemplate()

    var request = new window.XMLHttpRequest()
    var outputModel = new OutputModel()
    outputModel.preview = 'Updating ' + this.model.name + ' from ' + this.model.url

    this.renderSubview(new ResultView({
      request: request,
      model: outputModel,
      onBack: App.router.redirectTo.bind(App.router, '/host/' + this.model.collection.parent.name + '/apps'),
      onDone: App.router.redirectTo.bind(App.router, '/host/' + this.model.collection.parent.name + '/apps'),
      onSuccess: function (app) {
        outputModel.successHeader = 'Update complete'
        outputModel.successMessage = 'Updated ' + this.model.name
      }.bind(this)
    }), '[data-hook=holder]')

    request.open('put', this.model.collection.parent.url + '/apps/' + this.model.name + '/refs', true)
    request.send()
  }
})
