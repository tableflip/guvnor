var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')
var CheckboxView = require('ampersand-checkbox-view')
var SelectView = require('ampersand-select-view')
var MapInputView = require('./controls/map')
var templates = require('../templates')

module.exports = FormView.extend({
  fields: function () {
    var instances = []

    if (window.app.host.cpus.length === 1) {
      // single core machines can't do clusters...
      instances = ['1']
    } else {
      // clusters can have $CPUs - 1 instances
      for (var i = 0; i < window.app.host.cpus.length - 1; i++) {
        instances.push('' + (i + 1))
      }
    }

    var host = this.model.collection.parent

    var fields = [
      new SelectView({
        label: 'User',
        name: 'user',
        parent: this,
        options: host.users,
        value: this.model.user,
        textAttribute: 'name',
        template: templates.forms.controls.select()
      }),
      new SelectView({
        label: 'Group',
        name: 'group',
        parent: this,
        options: [this.model.group],
        value: this.model.group,
        template: templates.forms.controls.select()
      }),
      new CheckboxView({
        label: 'Debug',
        name: 'debug',
        value: this.model.debug,
        parent: this,
        template: templates.forms.controls.checkbox()
      }),
      new SelectView({
        label: 'Instances',
        name: 'instances',
        parent: this,
        options: instances,
        value: '1',
        template: templates.forms.controls.select()
      }),
      new InputView({
        label: 'Node arguments',
        name: 'execArgv',
        value: this.model.execArgv.join(' '),
        required: false,
        placeholder: '--harmony --abort_on_uncaught_exception',
        parent: this,
        template: templates.forms.controls.input()
      }),
      new InputView({
        label: 'Program arguments',
        name: 'argv',
        value: this.model.argv.join(' '),
        required: false,
        placeholder: '--arg1 --arg2',
        parent: this,
        template: templates.forms.controls.input()
      }),
      new MapInputView({
        label: 'Environmental variables',
        name: 'env',
        value: this.model.env,
        parent: this,
        minLength: 0,
        maxLength: 100,
        template: templates.forms.controls.array(),
        elementTemplate: templates.forms.controls.element(),
        keyView: {
          view: InputView,
          options: {
            placeholder: 'NODE_ENV',
            type: 'text',
            template: templates.forms.controls.input()
          }
        },
        valueView: {
          view: InputView,
          options: {
            placeholder: 'production',
            type: 'text',
            template: templates.forms.controls.input()
          }
        }
      })
    ]

    if (this.model.cwd) {
      // apps don't have a cwd to speak of..
      fields.splice(3, 0, new InputView({
        label: 'Current working directory',
        name: 'cwd',
        value: this.model.cwd,
        required: false,
        placeholder: '/path/to/directory',
        parent: this,
        template: templates.forms.controls.input()
      }))
    }

    var userView = fields[0]
    var groupView = fields[1]

    host.users.fetch({
      success: this._updateGroup.bind(this, userView, groupView)
    })

    userView.el.addEventListener('change', this._updateGroup.bind(this, userView, groupView))

    return fields
  },
  _updateGroup: function (userView, groupView) {
    var selectedUser = userView.value

    if (!selectedUser) {
      var host = this.model.collection.parent

      // try the user set on the app info
      selectedUser = host.users.get(this.model.user)

      if (!selectedUser) {
        // just take the first user
        selectedUser = host.users.models[0]
      }

      userView.setValue(selectedUser)
    }

    groupView.options = selectedUser.groups.sort()
    groupView.setValue(selectedUser.group)
    groupView.renderOptions()
    groupView.updateSelectedOption()
  }
})
