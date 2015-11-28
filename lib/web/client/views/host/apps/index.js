var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')

var VIEWS = {
  'loading': require('./loading'),
  'loaded': require('./list'),
  'error-loading': require('./error-loading'),
  'install': require('./install')
}

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.appsStatus': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        this.switcher.set(new VIEWS[this.model.appsStatus]({
          model: this.model
        }))
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
