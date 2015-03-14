var PageView = require('./base')

module.exports = PageView.extend({
  initialize: function () {
    // if this host is removed from the collection while we are looking at it, redirect the user to the overview
    this.listenTo(window.app.hosts, 'remove', function (host) {
      if (host.name === this.model.name) {
        window.app.navigate('/')
      }
    })
  },
  bindings: {
    'model.name': '[data-hook=host-name]'
  }
})
