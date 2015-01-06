var Collection = require('ampersand-rest-collection'),
  Latency = require('./latency');

module.exports = Collection.extend({
  url: function() {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/latency'
  },
  model: Latency,
  comparator: 'date'
})
