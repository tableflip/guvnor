var View = require('ampersand-view'),
  templates = require('../../templates'),
  dom = require('ampersand-dom'),
  semver = require('semver')

module.exports = View.extend({
  template: templates.includes.hostlist.process,
  bindings: {
    'model.name': '[data-hook=process-name]',
    'model.language': {
      type: function (el, value) {
        var nodeVersion = this.model.collection.parent.versions.node
        var className = semver.satisfies(nodeVersion, '>=1.0.0') ? 'iojsIcon' : 'nodeIcon'

        if(value == 'coffee') {
          className += ' fa fa-coffee'
        } else {
          className += ' icon-nodejs'
        }

        el.className = className
      },
      selector: '[data-hook=process-icon]'
    }
  },
  events: {
    'click a[href]': 'updateActiveNav'
  },
  updateActiveNav: function() {
    var el = this.query('.process')
    dom.addClass(el, 'active')
  }
})
