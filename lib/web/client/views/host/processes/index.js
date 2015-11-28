var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var ProcessView = require('./process')
var NoProcessesView = require('./empty')

module.exports = View.extend({
  template: require('./processes.hbs'),
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
