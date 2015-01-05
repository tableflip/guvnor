var Collection = require('ampersand-rest-collection'),
  CPU = require('./cpu');

module.exports = Collection.extend({
  url: function() {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/cpu'
  },
  model: CPU,
  comparator: 'date'
})
