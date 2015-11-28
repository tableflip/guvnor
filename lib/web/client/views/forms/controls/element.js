var View = require('ampersand-view')
var _ = require('underscore')

module.exports = View.extend({
  render: function () {
    this.renderWithTemplate()

    this.keyInput.el = this.queryByHook('key')
    this.valueInput.el = this.queryByHook('value')

    this.keyInput.render()
    this.valueInput.render()
  },
  bindings: _.extend({
    'removable': {
      type: 'toggle',
      hook: 'remove-field'
    }
  }),
  derived: {
    valid: {
      fn: function () {
        return this.keyInput.valid && this.valueInput.valid
      },
      cache: false
    }
  },
  props: {
    removable: 'boolean',
    template: ['string'],
    keyInput: 'any',
    valueInput: 'any'
  },
  events: {
    'click [data-hook~=remove-field]': 'handleRemoveClick'
  },
  handleRemoveClick: function () {
    this.parent.removeField(this)
  }
})
