var App = require('ampersand-app')
var View = require('ampersand-view')

var ICONS = {
  'running': 'check-circle',
  'stopped': 'stop-circle',
  'error': 'exclamation-circle',
  'unknown': 'question-circle',
  'paused': 'pause-circle'
}

var TITLES = {
  'running': ' is running',
  'stopped': ' is stopped',
  'error': ' has failed to start',
  'unknown': ' is not responding',
  'paused': ' is paused'
}

module.exports = View.extend({
  template: require('./process.hbs'),
  bindings: {
    'model.name': '[data-hook=name]',
    'model.user': '[data-hook=user]',
    'model.group': '[data-hook=group]',
    'model.uptimeFormatted': '[data-hook=uptime]',
    'model.memoryFormatted': '[data-hook=memory]',
    'model.cpuFormatted': '[data-hook=cpu]',
    'model.status': {
      type: function updateStatusIcon (el, value) {
        el.className = 'fa fa-' + ICONS[value]
        el.title = this.model.name + TITLES[value]
      },
      selector: '[data-hook=icon]'
    }
  },
  events: {
    'click td': 'showProcess'
  },
  showProcess: function () {
    App.navigate('/host/' + this.model.collection.parent.name + '/process/' + this.model.name)
  }
})
