var HostPage = require('../host')
var templates = require('../../templates')
var CollectionView = require('ampersand-collection-view')
var ProcessView = require('../../views/processlist/process')
var NoProcessesView = require('../../views/processlist/empty')

module.exports = HostPage.extend({
  template: templates.pages.host.processes,
  subviews: {
    processes: {
      container: '[data-hook=processes]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.processes,
          view: ProcessView,
          emptyView: NoProcessesView
        })
      }
    }
  }
})
