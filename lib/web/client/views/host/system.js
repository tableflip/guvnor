var View = require('ampersand-view')

module.exports = View.extend({
  template: require('./system.hbs'),
  bindings: {
    'model.uptimeFormatted': {
      type: 'text',
      hook: 'uptime'
    },
    'model.cpuSpeed': {
      type: 'text',
      hook: 'cpuSpeed'
    }
  }
})
