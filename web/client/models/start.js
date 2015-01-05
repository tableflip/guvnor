var AmpersandModel = require('ampersand-model')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    name: 'string',
    user: 'string',
    group: 'string',
    script: 'string',
    cwd: 'string',
    env: ['object', true, function() {
      return {}
    }],
    argv: ['array', true, function() {
      return []
    }],
    execArgv: ['array', true, function() {
      return []
    }],
    instances: ['number', true, 1]
  }
})
