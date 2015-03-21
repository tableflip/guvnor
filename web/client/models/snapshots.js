var Collection = require('ampersand-rest-collection')
var Snapshot = require('./snapshot')

module.exports = Collection.extend({
  url: function () {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/snapshots'
  },
  model: Snapshot
})
