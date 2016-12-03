var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var AlertView = require('../../alert')
var AlertModel = require('../../../models/alert')
var LogsView = require('./logs')
var $ = require('jquery')

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.logsStatus': {
      type: function (el, value) {
        this.chooseView()
      }
    }
  },
  chooseView: function () {
    if (!this.switcher) {
      return
    }

    var view

    if (this.model.logsStatus === 'loading') {
      view = new AlertView({
        model: new AlertModel({
          type: 'info',
          indeterminate: true,
          title: 'Loading logs',
          message: 'Loading logs for ' + this.model.name
        })
      })
    } else if (this.model.logsStatus === 'error-loading') {
      view = new AlertView({
        model: new AlertModel({
          type: 'danger',
          title: 'Could not load logs',
          message: 'Could not load logs for ' + this.model.name
        })
      })
    } else if (this.model.logsStatus === 'loaded') {
      view = new LogsView({
        model: this.model
      })
    }

    this.switcher.set(view)
  },
  render: function () {
    this.renderWithTemplate()

    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))

    if (this.model.logsStatus === 'loaded' || this.model.logsStatus === 'loading') {
      this.chooseView()

      return
    }

    this.model.logsStatus = 'loading'

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name + '/logs',
      type: 'GET',
      xhrFields: {
        withCredentials: true
      },
      success: function (logs) {
        this.model.logsStatus = 'loaded'
        this.model.logs = logs
      }.bind(this),
      error: function () {
        this.model.logsStatus = 'error-loading'
      }.bind(this)
    })
  }
})
