var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  props: {
    type: {
      type: 'string',
      values: ['info', 'success', 'warning', 'danger']
    },
    title: 'string',
    message: 'string',
    indeterminate: 'boolean'
  },
  derived: {
    typeClass: {
      deps: ['type'],
      fn: function () {
        return 'alert-' + this.type
      }
    }
  }
})
