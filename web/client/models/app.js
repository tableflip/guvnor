var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    name: 'string',
    user: 'string',
    url: 'string',

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
    isRemoving: 'boolean',
    isStarting: 'boolean'
  }
})
