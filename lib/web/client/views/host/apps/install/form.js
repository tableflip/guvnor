var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')

module.exports = FormView.extend({
  template: require('./install.hbs'),
  fields: function () {
    return [
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
    ]
  }
})
