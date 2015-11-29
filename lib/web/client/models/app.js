var AmpersandModel = require('ampersand-model')
var Refs = require('./refs')

module.exports = AmpersandModel.extend({
  idAttribute: 'name',
  props: {
    name: 'string',
    user: 'string',
    url: 'string',
    ref: ['object', true, function () {
      return {}
    }],
    execArgv: ['array', true, function () {
      return []
    }],
    argv: ['array', true, function () {
      return []
    }],
    env: ['object', true, function () {
      return {}
    }],
    group: 'string',
    debug: 'boolean',
    instances: 'number'
  },
  session: {
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
