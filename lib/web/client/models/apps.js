var Collection = require('ampersand-rest-collection')
var App = require('./app')

module.exports = Collection.extend({
  url: function () {
    return this.parent.url + '/apps'
  },
  ajaxConfig: {
    xhrFields: {
      withCredentials: true
    }
  },
  model: App,
  mainIndex: 'name',
  comparator: 'name'
})
