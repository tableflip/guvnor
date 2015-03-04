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

    var fields = [
      new SelectView({
        label: 'User',
        name: 'user',
        parent: this,
        options: window.app.host.users,
        value: this.model.user || window.app.host.users[0],
        template: templates.forms.controls.select()
      }),
      new SelectView({
        label: 'Group',
        name: 'group',
        parent: this,
        options: window.app.host.groups,
        value: this.model.group || window.app.host.groups[0],
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

    return fields
  }
})
