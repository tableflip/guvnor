var Collection = require('ampersand-rest-collection')
var Exception = require('./exception')

module.exports = Collection.extend({
  url: function () {
    return this.parent.collection.parent.url + '/processes/' + this.parent.name + '/exceptions'
  },
  model: Exception,
  session: {
    isRemoving: ['boolean', true, false]
  },
})
