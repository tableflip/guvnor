var PageView = require('../base')

function endsWith (haystack, needle) {
  return haystack.substring(haystack.length - needle.length) === needle
}

module.exports = PageView.extend({
  pageTitle: function () {
    return 'Guvnor - ' + this.model.name + ' - ' + this.model.status
  },
  initialize: function () {
    // if this process is removed from the collection while we are looking at it, redirect the user to the host overview
    this.listenTo(window.app.hosts.get(this.model.collection.parent.name).processes, 'remove', function (process) {
      if (process.id === this.model.id) {
        window.app.navigate('/host/' + this.model.collection.parent.name)
      }
    })
  },
  bindings: {
    'model.name': '[data-hook=process-name]',
    'model.status': {
      type: function (el, value) {
        if (value === 'running' && (endsWith(window.location.href, 'logs') || endsWith(window.location.href, 'execeptions') || endsWith(window.location.href, 'snapshots'))) {
          return
        }

        // if the status of a process changes while we are watching it, redirect the
        // user to a page with an appropriate message
        if (window.location.href.substring(window.location.href.length - value.length) === value) {
          return
        }

        // dirty looking setTimeout because the first time this code gets run, we
        // are inside the router.trigger callback for the default page and probably
        // haven't finished displaying it yet..
        setTimeout(window.app.navigate.bind(window.app, '/host/' + this.model.collection.parent.name + '/process/' + this.model.id + '/' + value))
      }
    },
    'model.collection.parent.status': {
      type: function (el, value) {
      }
    }
  }
})
