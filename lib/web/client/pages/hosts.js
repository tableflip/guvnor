var View = require('ampersand-view')
var PageView = require('./base')
var CollectionView = require('ampersand-collection-view')
var templates = require('../templates')
var HostView = require('../views/hosts/host')

module.exports = PageView.extend({
  template: templates.pages.hosts,
  subviews: {
    hosts: {
      hook: 'hostlist',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          view: HostView,
          emptyView: View.extend({
            template: templates.pages.loadinghosts
          }),
          collection: this.collection
        })
      }
    }
  }
})
