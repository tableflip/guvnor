var View = require('ampersand-view'),
  templates = require('../../templates')

module.exports = View.extend({
  template: templates.includes.processlist.process,
  bindings: {
    'model.pid': '[data-hook=pid]',
    'model.name': '[data-hook=name]',
    'model.user': '[data-hook=user]',
    'model.group': '[data-hook=group]',
    'model.uptimeFormatted': '[data-hook=uptime]',
    'model.restarts': '[data-hook=restarts]',
    'model.memoryFormatted': '[data-hook=memory]',
    'model.cpuFormatted': '[data-hook=cpu]'
  },
  events: {
    "click td": "showProcess"
  },
  showProcess: function() {
    window.app.navigate('/host/' + this.model.collection.parent.name + '/process/' + this.model.id)
  }
})
