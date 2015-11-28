var Collection = require('ampersand-rest-collection')
var App = require('./app')

module.exports = Collection.extend({
  url: function () {
    return this.parent.url + '/apps'
  },
  model: App
})
