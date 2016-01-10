var PageView = require('../base')
var App = require('ampersand-app')
var ViewSwitcher = require('ampersand-view-switcher')
var UnknownView = require('./unknown')

var VIEWS = {
  'error': require('./errored'),
  'paused': require('./paused'),
  'stopped': require('./stopped'),
  'unknown': UnknownView
}

module.exports = PageView.extend({
  template: '<section class="page host" data-hook="switcher"></section>',
  pageTitle: function () {
    return this.model.name + ' - ' + this.model.status
  },
  initialize: function (options) {
    var host = this.model.collection.parent

    this.runningPage = options.runningPage

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

    this.choosePage()
  },
  bindings: {
    'model.name': '[data-hook=process-name]',
    'model.status': {
      type: function (el, value) {
        if (!this.switcher) {
          return
        }

        this.choosePage()
      }
    },
    'model.collection.parent.status': {
      type: function (el, value) {
      }
    }
  },
  choosePage: function () {
    var Page

    if (this.model.status === 'running') {
      Page = this.runningPage
    } else {
      Page = VIEWS[this.model.status] || UnknownView
    }

    this.switcher.set(new Page({
      model: this.model
    }))
  }
})
