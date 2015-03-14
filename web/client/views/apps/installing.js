var View = require('ampersand-view')
var templates = require('../../templates')
var CollectionView = require('ampersand-collection-view')
var LineView = require('./line')

module.exports = View.extend({
  template: templates.includes.apps.installing,
  initialize: function () {
    this.listenTo(this.model.logs, 'add', this.scrollLogs.bind(this))
  },
  scrollLogs: function () {
    setTimeout(function () {
      var list = this.query('[data-hook=install-log]')

      list.scrollTop = list.scrollHeight
    }.bind(this), 100)
  },
  subviews: {
    lines: {
      container: '[data-hook=install-log]',
      prepareView: function (el) {
        return new CollectionView({
            el: el,
            collection: this.model.logs,
            view: LineView
          })
      }
    }
  }
})
