var AmpersandModel = require('ampersand-model')
var Logs = require('./logs')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    name: 'string',
    url: 'string'
  },
  collections: {
    logs: Logs
  }
})
