var Collection = require('ampersand-rest-collection'),
  Exception = require('./exception');

module.exports = Collection.extend({
  url: function() {
    return '/hosts/' + this.parent.collection.parent.name + '/processes/' + this.parent.id + '/exceptions'
  },
  model: Exception
})
