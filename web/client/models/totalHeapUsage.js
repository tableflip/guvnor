var Collection = require('ampersand-rest-collection'),
  TotalHeap = require('./totalHeap');

module.exports = Collection.extend({
  url: function() {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/totalHeap'
  },
  model: TotalHeap,
  comparator: 'date'
})
