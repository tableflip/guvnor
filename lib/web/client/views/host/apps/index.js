var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var AlertView = require('../../alert')
var AlertModel = require('../../../models/alert')
var AppListView = require('./list')
var InstallAppView = require('./install')

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.appsStatus': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        var view

        if (this.model.appsStatus === 'loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'info',
              indeterminate: true,
              title: 'Loading apps',
              message: 'Loading apps for ' + this.model.name
            })
          })
        } else if (this.model.appsStatus === 'error-loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'danger',
              title: 'Could not load apps',
              message: 'Could not load apps for ' + this.model.name
            })
          })
        } else if (this.model.appsStatus === 'loaded') {
          view = new AppListView({
            model: this.model
          })
        } else if (this.model.appsStatus === 'install') {
          view = new InstallAppView({
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

    this.model.appsStatus = 'loading'

    this.model.apps.fetch({
      success: this.model.set.bind(this.model, 'appsStatus', 'loaded'),
      error: this.model.set.bind(this.model, 'appsStatus', 'error-loading'),
      merge: true
    })
  }
})
