var AmpersandModel = require('ampersand-model'),
  Logs = require('./logs')

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
