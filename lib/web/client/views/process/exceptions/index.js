var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var AlertView = require('../../alert')
var AlertModel = require('../../../models/alert')
var SnapshotListView = require('./list')

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.exceptionsStatus': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        var view

        if (this.model.exceptionsStatus === 'loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'info',
              indeterminate: true,
              title: 'Loading exceptions',
              message: 'Loading exceptions for ' + this.model.name
            })
          })
        } else if (this.model.exceptionsStatus === 'error-loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'danger',
              title: 'Could not load exceptions',
              message: 'Could not load exceptions for ' + this.model.name
            })
          })
        } else if (this.model.exceptionsStatus === 'loaded') {
          view = new SnapshotListView({
            model: this.model
          })
        }

        this.switcher.set(view)
      }
    }
  },
  render: function () {
    this.renderWithTemplate()

    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))

    this.model.exceptionsStatus = 'loading'

    this.model.exceptions.fetch({
      success: this.model.set.bind(this.model, 'exceptionsStatus', 'loaded'),
      error: this.model.set.bind(this.model, 'exceptionsStatus', 'error-loading'),
      merge: true
    })
  }
})
