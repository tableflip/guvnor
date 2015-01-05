var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  idProperty: 'date',
  props: {
    date: 'number',
    usage: 'number'
  }
})
