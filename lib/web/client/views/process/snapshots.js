var ProcessPage = require('../process')
var CollectionView = require('ampersand-collection-view')
var SnapshotsView = require('./snapshots/entry')
var NoSnapshotsView = require('./snapshots/empty')
var SnapshotButton = require('../buttons/snapshot')

module.exports = ProcessPage.extend({
  template: require('./snapshots.hbs'),
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
