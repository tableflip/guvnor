var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  idAttribute: 'name',
  props: {
    name: 'string',
    type: {
      type: 'string',
      valid: ['branch', 'tag']
    },
    commit: 'string'
  }
})
