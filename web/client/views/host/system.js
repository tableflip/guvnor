var View = require('ampersand-view')
var templates = require('../../templates')

module.exports = View.extend({
  template: templates.includes.host.system,
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
