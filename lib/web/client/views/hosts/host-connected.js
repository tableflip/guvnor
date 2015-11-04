var View = require('ampersand-view')
var templates = require('../../templates')
var CPUView = require('./cpu')
var MemoryView = require('./memory')

module.exports = View.extend({
  template: templates.includes.host.connected,
  bindings: {
    'model.os': {
      type: function (el, value) {
        if (!value || value === 'unknown') {
          el.className = 'fa fa-desktop'
        } else if (value === 'darwin') {
          el.className = 'fa fa-apple'
        } else if (value === 'linux') {
          el.className = 'fa fa-linux'
        } else {
          el.className = 'icon-' + value
        }
      },
      hook: 'host-icon'
    }
  },
  subviews: {
    cpu: {
      hook: 'cpu',
      prepareView: function (el) {
        return new CPUView({
          el: el,
          model: this.model
        })
      }
    },
    memory: {
      hook: 'memory',
      prepareView: function (el) {
        return new MemoryView({
          el: el,
          model: this.model
        })
      }
    }
  }
})
