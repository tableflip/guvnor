var HostPage = require('../host')
var templates = require('../../templates')
var CollectionRenderer = require('ampersand-collection-view')
var ProcessView = require('../../views/processlist/process')

module.exports = HostPage.extend({
  template: templates.pages.host.processes,
  initialize: function () {
    HostPage.prototype.initialize.call(this)

    this.listenTo(this.model.processes, 'add', function () {
      if (this.model.processes.length <= 1) {
        // if length == 1 then the list used to be empty so call render to remove
        // the 'nothing to show' message and show the list instead
        this.render()
      }
    })
  },
  subviews: {
    processes: {
      container: '[data-hook=processes]',
      prepareView: function (el) {
        return new CollectionRenderer({
            el: el,
            collection: this.model.processes,
            view: ProcessView
          })
      }
    }
  },
  bindings: {
    'model.processes.length': {
      type: 'toggle',
      no: '[data-hook=no-processes]',
      yes: '[data-hook=process-list]'
    }
  }
})
