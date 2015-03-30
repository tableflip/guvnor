var ProcessPage = require('../process')
var templates = require('../../templates')
var CollectionView = require('ampersand-collection-view')
var SnapshotsView = require('../../views/process/snapshotlist/entry')
var NoSnapshotsView = require('../../views/process/snapshotlist/empty')
var SnapshotButton = require('../../buttons/snapshot')

module.exports = ProcessPage.extend({
  template: templates.pages.process.snapshots,
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
