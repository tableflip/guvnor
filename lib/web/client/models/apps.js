var Collection = require('ampersand-rest-collection')
var App = require('./app')

module.exports = Collection.extend({
  url: function () {
    return '/hosts/' + this.parent.name + '/apps'
  },
  model: App
})
