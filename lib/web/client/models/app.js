var AmpersandModel = require('ampersand-model')
var Refs = require('./refs')

module.exports = AmpersandModel.extend({
  idAttribute: 'name',
  props: {
    name: 'string',
    url: 'string',
    version: 'string',
    user: 'string',
    group: 'string',
    path: 'string',
    ref: ['object', true, function () {
      return {}
    }]
  },
  session: {
    isRemoving: 'boolean',
    refsStatus: {
      type: 'string',
      values: [
        'loading', 'loaded', 'error-loading', 'switching'
      ]
    }
  },
  collections: {
    refs: Refs
  }
})
