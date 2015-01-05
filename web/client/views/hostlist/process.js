var View = require('ampersand-view'),
  templates = require('../../templates'),
  dom = require('ampersand-dom')

module.exports = View.extend({
  template: templates.includes.hostlist.process,
  bindings: {
    'model.name': '[data-hook=process-name]'
  },
  events: {
    'click a[href]': 'updateActiveNav'
  },
  updateActiveNav: function() {
    var el = this.query('.process')
    dom.addClass(el, 'active')
  }
})
