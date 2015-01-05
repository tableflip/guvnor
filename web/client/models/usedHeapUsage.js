var Collection = require('ampersand-rest-collection'),
  UsedHeap = require('./usedHeap');

module.exports = Collection.extend({
  url: function() {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/usedHeap'
  },
  model: UsedHeap,
  comparator: 'date'
})
