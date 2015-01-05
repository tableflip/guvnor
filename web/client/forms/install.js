var FormView = require('ampersand-form-view'),
  InputView = require('ampersand-input-view'),
  templates = require('../templates')

module.exports = FormView.extend({
  template: templates.includes.apps.install,
  fields: function () {
    return [
      new InputView({
        label: 'URL (required)',
        name: 'url',
        value: this.model.url,
        placeholder: 'https://github.com/you/your-project.git',
        parent: this,
        template: templates.forms.controls.input()
      }),
      new InputView({
        label: 'Name',
        name: 'name',
        value: this.model.name,
        placeholder: 'Your Project',
        parent: this,
        required: false,
        template: templates.forms.controls.input()
      })
    ]
  }
})
