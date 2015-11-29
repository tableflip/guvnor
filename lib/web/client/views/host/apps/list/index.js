var App = require('ampersand-app')
var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var AppView = require('./app')
var NoAppsView = require('./empty')

module.exports = View.extend({
  template: require('./list.hbs'),
  subviews: {
    apps: {
      container: '[data-hook=apps]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.apps,
          view: AppView,
          emptyView: NoAppsView
        })
      }
    }
  },
  events: {
    'click [data-hook=installbutton]': 'installApp'
  },
  installApp: function (event) {
    event.target.blur()

    App.router.redirectTo('/host/' + this.model.name + '/apps/install')
  }
})
