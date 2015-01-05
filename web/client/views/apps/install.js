var View = require('ampersand-view'),
  templates = require('../../templates'),
  InstallForm = require('../../forms/install'),
  App = require('../../models/app')

module.exports = View.extend({
  template: templates.includes.apps.install,
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  subviews: {
    form: {
      container: 'form',
      prepareView: function(el) {
        return new InstallForm({
          model: new App(),
          el: el,
          submitCallback: function (data) {
            this.onSubmit(data)
          }.bind(this)
        })
      }
    }
  },
  onCancel: function() {

  },
  onSubmit: function(data) {

  }
})
