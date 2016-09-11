var Collection = require('ampersand-rest-collection')
var Snapshot = require('./snapshot')

module.exports = Collection.extend({
  url: function () {
    return this.parent.collection.parent.url + '/processes/' + this.parent.name + '/heapsnapshots'
  },
  ajaxConfig: {
    xhrFields: {
      withCredentials: true
    }
  },
  model: Snapshot,
  session: {
    isRemoving: ['boolean', true, false]
  }
})
