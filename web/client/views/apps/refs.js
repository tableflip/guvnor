var View = require('ampersand-view')
var templates = require('../../templates')
var RefsForm = require('../../forms/refs')

module.exports = View.extend({
  template: templates.includes.apps.refs,
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  subviews: {
    form: {
      container: 'form',
      prepareView: function (el) {
        return new RefsForm({
          model: this.model,
          el: el,
          submitCallback: function (data) {
            this.onSubmit(data)
          }.bind(this)
        })
      }
    }
  },
  onCancel: function () {
  },
  onSubmit: function (data) {
  }
})
