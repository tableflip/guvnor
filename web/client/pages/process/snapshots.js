var ProcessPage = require('../process')
var templates = require('../../templates')
var CollectionView = require('ampersand-collection-view')
var SnapshotsView = require('../../views/process/snapshotlist/entry')
var NoSnapshotsView = require('../../views/process/snapshotlist/empty')
var notify = require('../../helpers/notification')

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
    }
  },
  bindings: {
    'model.isHeapDump': [{
      type: 'booleanClass',
      no: 'fa-h-square',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=heapdumpbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=heapdumpbutton]'
    }]
  },
  events: {
    'click [data-hook=heapdumpbutton]': 'heapDumpProcess'
  },
  heapDumpProcess: function (event) {
    event.target.blur()

    this.model.isHeapDump = true

    window.app.socket.emit('process:heapdump', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      this.model.isHeapDump = false

      if (error) {
        notify({
          header: 'Snapshot error',
          message: ['%s on %s has failed to dump heap - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Snapshot complete',
          message: ['%s on %s has taken a heap snapshot', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  }
})
