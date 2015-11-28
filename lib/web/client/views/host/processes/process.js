var app = require('ampersand-app')
var View = require('ampersand-view')

module.exports = View.extend({
  template: require('./process.hbs'),
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
    'click td': 'showProcess'
  },
  showProcess: function () {
    app.navigate('/host/' + this.model.collection.parent.name + '/process/' + this.model.id)
  }
})
