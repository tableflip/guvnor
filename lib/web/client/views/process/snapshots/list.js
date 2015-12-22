var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var SnapshotsView = require('./entry')
var NoSnapshotsView = require('./empty')
var SnapshotButton = require('../../buttons/snapshot')

module.exports = View.extend({
  template: require('./list.hbs'),
  subviews: {
    snapshots: {
      container: '[data-hook=snapshots]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.snapshots,
          view: SnapshotsView,
          emptyView: NoSnapshotsView
        })
      }
    },
    snapshotButton: {
      container: '[data-hook=snapshotbutton]',
      prepareView: function (el) {
        return new SnapshotButton({
          el: el,
          model: this.model
        })
      }
    }
  }
})
