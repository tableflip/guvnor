var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')
var CheckboxView = require('ampersand-checkbox-view')

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
        label: 'User',
        name: 'user',
        value: this.model.user || '',
        required: false,
        placeholder: 'User',
        parent: this
      }),
      new InputView({
        label: 'Url',
        name: 'url',
        value: this.model.url || '',
        required: false,
        placeholder: 'Url',
        parent: this
      }),
      new InputView({
        label: 'Cwd',
        name: 'cwd',
        value: this.model.cwd || '',
        required: false,
        placeholder: 'Cwd',
        parent: this
      }),
      new InputView({
        label: 'Exec Argv',
        name: 'execArgv',
        value: this.model.execArgv || '',
        required: false,
        placeholder: 'Exec Argv',
        parent: this
      }),
      new InputView({
        label: 'Group',
        name: 'group',
        value: this.model.group || '',
        required: false,
        placeholder: 'Group',
        parent: this
      }),
      new CheckboxView({
        label: 'Debug',
        name: 'debug',
        value: this.model.debug,
        parent: this
      }),
      new InputView({
        label: 'Instances',
        name: 'instances',
        value: this.model.instances || '',
        required: false,
        placeholder: 'Instances',
        parent: this
      })
    ]
  }
})
