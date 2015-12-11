var PageView = require('../base')
var App = require('ampersand-app')
var ViewSwitcher = require('ampersand-view-switcher')
var UnknownView = require('./unknown')

var VIEWS = {
  'running': require('./overview'),
  'stopped': require('./stopped'),
  'error': require('./errored'),
  'unknown': UnknownView,
  'paused': require('./paused')
}

module.exports = PageView.extend({
  template: '<section class="page host" data-hook="switcher"></section>',
  pageTitle: function () {
    return 'Guvnor - ' + this.model.name + ' - ' + this.model.status
  },
  initialize: function () {
    var host = this.model.collection.parent

    // if this process is removed from the collection while we are looking at it, redirect the user to the host overview
    this.listenTo(host.processes, 'remove', function (process) {
      if (process.id === this.model.id) {
        App.navigate('/host/' + this.model.collection.parent.name + '/processes')
      }
    })
  },
  render: function () {
    this.renderWithTemplate()

    this.switcher = new ViewSwitcher(this.queryByHook('switcher'))

    var Page = VIEWS[this.model.status] || UnknownView

    this.switcher.set(new Page({
      model: this.model
    }))
  },
  bindings: {
    'model.name': '[data-hook=process-name]',
    'model.status': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        var Page = VIEWS[this.model.status] || UnknownView

        this.switcher.set(new Page({
          model: this.model
        }))
      }
    },
    'model.collection.parent.status': {
      type: function (el, value) {
      }
    }
  }
})
