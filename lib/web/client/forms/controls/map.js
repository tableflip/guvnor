var View = require('ampersand-view')
var _ = require('underscore')
var FieldView = require('./element')

var defaultTemplate = [
  '<div>',
  '<span data-hook="label"></span>',
  '<div data-hook="field-container"></div>',
  '<a data-hook="add-field" class="add-input">add</a>',
  '<div data-hook="main-message-container" class="message message-below message-error">',
  '<p data-hook="main-message-text"></p>',
  '</div>',
  '</div>'
].join('')
var defaultElementTemplate = [
  '<label>',
  '<input data-hook="key">',
  '<input data-hook="value">',
  '<div data-hook="message-container" class="message message-below message-error">',
  '<p data-hook="message-text"></p>',
  '</div>',
  '<a data-hook="remove-field">remove</a>',
  '</label>'
].join('')

module.exports = View.extend({
  initialize: function () {
    if (!this.label) {
      this.label = this.name
    }

    this.fields = []

    if (!this.value) {
      this.value = {}
    }

    this.on('change:valid change:value', this.updateParent, this)
    this.render()

    if (Object.keys(this.value).length === 0) {
      this.addField('', '')
    }
  },
  render: function () {
    if (this.rendered) return
    this.renderWithTemplate()
    this.setValue(this.value)
    this.rendered = true
  },
  events: {
    'click [data-hook~=add-field]': 'handleAddFieldClick'
  },
  bindings: {
    'name': {
      type: 'attribute',
      selector: 'input',
      name: 'name'
    },
    'label': {
      hook: 'label'
    },
    'message': {
      type: 'text',
      hook: 'main-message-text'
    },
    'showMessage': {
      type: 'toggle',
      hook: 'main-message-container'
    },
    'canAdd': {
      type: 'toggle',
      hook: 'add-field'
    }
  },
  props: {
    name: ['string', true, ''],
    value: ['object', true, function () {
      return {}
    }],
    label: ['string', true, ''],
    message: ['string', true, ''],
    requiredMessage: 'string',
    validClass: ['string', true, 'input-valid'],
    invalidClass: ['string', true, 'input-invalid'],
    minLength: ['number', true, 0],
    maxLength: ['number', true, 10],
    template: ['string', true, defaultTemplate],
    elementTemplate: ['string', true, defaultElementTemplate],
    keyView: ['object', true, function () {
      return {
        view: ['any', true, ''],
        options: ['object', true, function () {
          return {}
        }],
        tests: ['array', true, function () {
          return []
        }],
        template: 'string'
      }
    }],
    valueView: ['object', true, function () {
      return {
        view: ['any', true, ''],
        options: ['object', true, function () {
          return {}
        }],
        tests: ['array', true, function () {
          return []
        }],
        template: 'string'
      }
    }]
  },
  session: {
    shouldValidate: ['boolean', true, false],
    fieldsValid: ['boolean', true, false],
    fieldsRendered: ['number', true, 0],
    rendered: ['boolean', true, false]
  },
  derived: {
    fieldClass: {
      deps: ['showMessage'],
      fn: function () {
        return this.showMessage ? this.invalidClass : this.validClass
      }
    },
    valid: {
      deps: ['requiredMet', 'fieldsValid'],
      fn: function () {
        return this.requiredMet && this.fieldsValid
      }
    },
    showMessage: {
      deps: ['valid', 'shouldValidate', 'message'],
      fn: function () {
        return !!(this.shouldValidate && this.message && !this.valid)
      }
    },
    canAdd: {
      deps: ['maxLength', 'fieldsRendered'],
      fn: function () {
        return this.fieldsRendered < this.maxLength
      }
    },
    requiredMet: {
      deps: ['value', 'minLength'],
      fn: function () {
        return Object.keys(this.value).length >= this.minLength
      }
    }
  },
  setValue: function (obj) {
    this.clearFields()
    for (var key in obj) {
      this.addField(key, obj[key])
    }
    this.update()
  },
  beforeSubmit: function () {
    this.fields.forEach(function (field) {
      field.keyInput.beforeSubmit()
      field.valueInput.beforeSubmit()
    })
    this.shouldValidate = true
    if (!this.valid && !this.requiredMet) {
      this.message = this.requiredMessage || this.getRequiredMessage()
    }
  },
  handleAddFieldClick: function (e) {
    e.preventDefault()
    var field = this.addField('', '')
    field.keyInput.input.focus()
  },
  addField: function (key, value) {
    var self = this
    var removable = (function () {
      if (self.fields.length >= self.minLength) {
        return true
      }
      return false
    }())
    var keyFieldInitOptions = {}

    for (var prop in this.keyView.options) {
      keyFieldInitOptions[prop] = this.keyView.options[prop]
    }

    keyFieldInitOptions.value = key
    keyFieldInitOptions.parent = this
    keyFieldInitOptions.required = true

    var valueFieldInitOptions = {}

    for (prop in this.valueView.options) {
      valueFieldInitOptions[prop] = this.valueView.options[prop]
    }

    valueFieldInitOptions.value = value
    valueFieldInitOptions.parent = this
    valueFieldInitOptions.required = true

    var KeyViewView = this.keyView.view
    var ValueViewView = this.valueView.view

    var initOptions = {
      parent: this,
      required: false,
      removable: removable,
      keyInput: new KeyViewView(keyFieldInitOptions),
      valueInput: new ValueViewView(valueFieldInitOptions)
    }

    var field = new FieldView(initOptions)
    field.template = this.elementTemplate
    field.render()
    this.fieldsRendered += 1
    this.fields.push(field)
    this.queryByHook('field-container').appendChild(field.el)
    return field
  },
  clearFields: function () {
    this.fields.forEach(function (field) {
      field.remove()
    })
    this.fields = []
    this.fieldsRendered = 0
  },
  removeField: function (field) {
    this.fields = _.without(this.fields, field)
    field.remove()
    this.fieldsRendered -= 1
    this.update()
  },
  update: function () {
    var valid = true
    var value = {}
    this.fields.forEach(function (field) {
      if (!field.valid) {
        valid = false

        return
      }

      value[field.keyInput.value] = field.valueInput.value
    })
    this.set({
      value: value,
      fieldsValid: valid
    })
  },
  updateParent: function () {
    if (this.parent) this.parent.update(this)
  },
  getRequiredMessage: function () {
    var plural = this.minLength > 1
    return 'Please enter at least ' + this.minLength + ' item' + (plural ? 's.' : '.')
  }
})
