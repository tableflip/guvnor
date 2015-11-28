var View = require('ampersand-view')
var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')

module.exports = View.extend({
  template: require('./install.hbs'),
  initialize: function (options) {
    this.options = options
  },
  render: function () {
    this.renderWithTemplate()
    this.form = new FormView({
      autoRender: true,
      el: this.el,
      model: this.model,
      fields: [
        new InputView({
          label: 'URL (required)',
          name: 'url',
          value: this.model.url,
          placeholder: 'https://github.com/you/your-project.git',
          parent: this,
          template: require('../../../forms/controls/input.hbs')
        }),
        new InputView({
          label: 'Name',
          name: 'name',
          value: this.model.name,
          placeholder: 'Your Project',
          parent: this,
          required: false,
          template: require('../../../forms/controls/input.hbs')
        })
      ],
      submitCallback: this.options.onSubmit,
      validCallback: function (valid) {
        if (valid) {
          console.log('The form is valid!')
        } else {
          console.log('The form is not valid!')
        }
      }
    })
  },
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  onCancel: function () {
    this.options.onCancel()
  }
})
