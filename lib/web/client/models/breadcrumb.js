var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  idAttribute: 'title',
  props: {
    title: 'string',
    path: 'string'
  }
})
