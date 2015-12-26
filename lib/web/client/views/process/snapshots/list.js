var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var App = require('ampersand-app')
var $ = require('jquery')
var ConfirmView = require('../../confirm')
var notify = require('../../../helpers/notification')
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
  },
  bindings: {
    'click [data-hook=clearbutton]': 'clearList'
  },
  clearList: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove all snapshots? This action cannot be undone.')

    App.modal.reset()
    App.modal.setTitle('Danger zone!')
    App.modal.setContent(confirmView)
    App.modal.setIsDanger(true)
    App.modal.setOkText('Remove')
    App.modal.setCallback(function () {
      this.model.snapshots.isRemoving = true

      var proc = this.model
      var host = proc.collection.parent

      $.ajax({
        url: host.url + '/processes/' + proc.name + '/heapsnapshots',
        type: 'DELETE',
        success: function () {
          this.model.snapshots.isRemoving = false

          notify({
            header: 'Snapshots cleared',
            message: ['All snapshots were cleared from %s', host.name]
          })

          this.model.snapshots.reset([])
        }.bind(this),
        error: function (request, type, error) {
          this.model.snapshots.isRemoving = false

          notify({
            header: 'Error clearing snapshots',
            message: ['Failed to remove snapshots from %s - %s', host.name, error],
            type: 'danger'
          })
        }.bind(this)
      })
    }.bind(this))
    App.modal.show()
  }
})
