var PageView = require('./base')

function endsWith (haystack, needle) {
  return haystack.substring(haystack.length - needle.length) === needle
}

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
    'model.name': '[data-hook=host-name]',
    'model.status': {
      type: function (el, value) {
        if (value === 'connected' && (endsWith(window.location.href, 'apps') || endsWith(window.location.href, 'processes'))) {
          return
        }

        // if the status of a process changes while we are watching it, redirect the
        // user to a page with an appropriate message
        if (endsWith(window.location.href, value)) {
          return
        }

        // dirty looking setTimeout because the first time this code gets run, we
        // are inside the router.trigger callback for the default page and probably
        // haven't finished displaying it yet..
        setTimeout(window.app.navigate.bind(window.app, '/host/' + this.model.name + '/' + value), 1)
      }
    }
  }
})
