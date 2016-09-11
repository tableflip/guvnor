var app = require('ampersand-app')
var PageView = require('../base')
var ViewSwitcher = require('ampersand-view-switcher')
var UnknownView = require('./unknown')

var VIEWS = {
  'connecting': require('./connecting'),
  'connected': require('./connected'),
  'server-error': require('./error'),
  'network-error': require('./network-error'),
  'auth-error': require('./auth-error')
}

module.exports = PageView.extend({
  template: require('./index.hbs'),
  initialize: function () {
    // if this host is removed from the collection while we are looking at it, redirect the user to the overview
    this.listenTo(app.hosts, 'remove', function (host) {
      if (host.url === this.model.url) {
        app.navigate('/')
      }
    }.bind(this))
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
    'model.name': '[data-hook=host-name]',
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
    }
  }
})
