var View = require('ampersand-view')
var templates = require('../../templates')
var StartForm = require('../../forms/start')
var splitargs = require('splitargs')

module.exports = View.extend({
  template: templates.includes.process.start,
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  subviews: {
    form: {
      container: '[data-hook=start-form]',
      prepareView: function (el) {
        return new StartForm({
          model: this.model,
          el: el,
          submitCallback: function (data) {
            data.execArgv = splitargs(data.execArgv)
            data.argv = splitargs(data.argv)
            data.instances = parseInt(data.instances, 10)
            data.user = data.user.name

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
