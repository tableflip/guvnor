var View = require('ampersand-view')
var templates = require('../../templates')
var CPUView = require('./cpu')
var MemoryView = require('./memory')
var ViewSwitcher = require('ampersand-view-switcher')

var VIEWS = {
  'connecting': View.extend({
    template: templates.includes.host.connecting,
  }),
  'connected': require('./host-connected'),
  'network-error': View.extend({
    template: templates.includes.host.networkerror,
  }),
  'server-error': View.extend({
    template: templates.includes.host.servererror,
  }),
  'incompatible': View.extend({
    template: templates.includes.host.incompatible,
  }),
  'timeout': View.extend({
    template: templates.includes.host.timeout,
  })
}

module.exports = View.extend({
  template: templates.includes.host.host,
  render: function () {
    this.renderWithTemplate()
    this.pageContainer = this.queryByHook('page-container');
    this.pageSwitcher = new ViewSwitcher(this.pageContainer)

    this.updateHostStatus()
  },
  bindings: {
    'model.status': {
      type: function (el, value) {
        this.updateHostStatus()
      },
      hook: 'page-container'
    }
  },
  updateHostStatus: function () {
    if (!this.pageSwitcher) {
      return
    }

    this.pageSwitcher.set(new VIEWS[this.model.status]({
      model: this.model
    }))
  }
})
