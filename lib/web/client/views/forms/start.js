var FormView = require('ampersand-form-view')
var InputView = require('ampersand-input-view')
var CheckboxView = require('ampersand-checkbox-view')
var SelectView = require('ampersand-select-view')
var MapInputView = require('./controls/map')
var App = require('ampersand-app')

module.exports = FormView.extend({
  fields: function () {
    var instances = []

    // clusters can have as many instances as CPUs
    for (var i = 0; i < App.host.cpus.length; i++) {
      instances.push('' + (i + 1))
    }

    var fields = [
      new SelectView({
        label: 'User',
        name: 'user',
        parent: this,
        options: App.host.users,
        eagerValidate: true,
        textAttribute: 'name',
        required: true,
        template: require('./controls/select.hbs')(),
        yieldModel: false
      }),
      new SelectView({
        label: 'Group',
        name: 'group',
        parent: this,
        options: [this.model.group],
        value: this.model.group,
        eagerValidate: true,
        required: true,
        template: require('./controls/select.hbs')()
      }),
      new CheckboxView({
        label: 'Debug',
        name: 'debug',
        value: this.model.debug,
        parent: this,
        template: require('./controls/checkbox.hbs')()
      }),
      new SelectView({
        label: 'Instances',
        name: 'instances',
        parent: this,
        options: instances,
        value: '1',
        eagerValidate: true,
        required: true,
        template: require('./controls/select.hbs')()
      }),
      new InputView({
        label: 'Node arguments',
        name: 'execArgv',
        value: this.model.execArgv.join(' '),
        required: false,
        placeholder: '--harmony --abort_on_uncaught_exception',
        parent: this,
        template: require('./controls/input.hbs')()
      }),
      new InputView({
        label: 'Program arguments',
        name: 'argv',
        value: this.model.argv.join(' '),
        required: false,
        placeholder: '--arg1 --arg2',
        parent: this,
        template: require('./controls/input.hbs')()
      }),
      new MapInputView({
        label: 'Environmental variables',
        name: 'env',
        value: this.model.env,
        parent: this,
        minLength: 0,
        maxLength: 100,
        template: require('./controls/array.hbs')(),
        elementTemplate: require('./controls/element.hbs')(),
        keyView: {
          view: InputView,
          options: {
            placeholder: 'NODE_ENV',
            type: 'text',
            template: require('./controls/input.hbs')()
          }
        },
        valueView: {
          view: InputView,
          options: {
            placeholder: 'production',
            type: 'text',
            template: require('./controls/input.hbs')()
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
        template: require('./controls/input.hbs')()
      }))
    }

    var userView = fields[0]
    var groupView = fields[1]

    App.host.users.fetch({
      success: function () {
        userView.setValue(this.model.user)
        this._updateGroup(userView, groupView)
      }.bind(this)
    })

    this.listenTo(this, 'change:user', this._updateGroup.bind(this, userView, groupView))

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

    var user = App.host.users.get(selectedUser)
    var groups = user.groups.sort()

    groupView.options = groups
    groupView.renderOptions()
    groupView.setValue(user.group)
  }
})
