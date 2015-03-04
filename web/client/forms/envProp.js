var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')

module.exports = FormView.extend({
  fields: function () {
    return [
      new InputView({
        label: 'Name',
        name: 'name',
        value: this.model.name || '',
        required: false,
        placeholder: 'Name',
        parent: this
      }),
      new InputView({
        label: 'Value',
        name: 'value',
        value: this.model.value || '',
        required: false,
        placeholder: 'Value',
        parent: this
      })
    ]
  }
})
