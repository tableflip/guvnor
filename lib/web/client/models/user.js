var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  idAttribute: 'uid',
  props: {
    name: 'string',
    group: 'string',
    groups: ['array', true, function () {
      return []
    }]
  }
})
