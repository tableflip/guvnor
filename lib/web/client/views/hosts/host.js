var View = require('ampersand-view')
var templates = require('../../templates')

module.exports = View.extend({
  template: templates.includes.hostlist.host,
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
      selector: '[data-hook=host-icon]'
    }
  }
})
