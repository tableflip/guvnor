var View = require('ampersand-view')
var ViewSwitcher = require('ampersand-view-switcher')
var AlertView = require('../../alert')
var AlertModel = require('../../../models/alert')
var SnapshotListView = require('./list')

module.exports = View.extend({
  template: '<div data-hook="switcher"></div>',
  bindings: {
    'model.heapStatus': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        var view

        if (this.model.heapStatus === 'loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'info',
              indeterminate: true,
              title: 'Loading snapshots',
              message: 'Loading snapshots for ' + this.model.name
            })
          })
        } else if (this.model.heapStatus === 'error-loading') {
          view = new AlertView({
            model: new AlertModel({
              type: 'danger',
              title: 'Could not load snapshots',
              message: 'Could not load snapshots for ' + this.model.name
            })
          })
        } else if (this.model.heapStatus === 'loaded') {
          view = new SnapshotListView({
            model: this.model
          })
        }

        this.switcher.set(view)
      }
    }
  },
  render: function () {
    this.renderWithTemplate()

    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))

    this.model.heapStatus = 'loading'

    this.model.snapshots.fetch({
      success: this.model.set.bind(this.model, 'heapStatus', 'loaded'),
      error: this.model.set.bind(this.model, 'heapStatus', 'error-loading'),
      merge: true
    })
  }
})
