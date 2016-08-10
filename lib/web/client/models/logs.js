var Collection = require('ampersand-rest-collection')
var Log = require('./log')

module.exports = Collection.extend({
  url: function () {
    return `${this.parent.collection.parent.url}/processes/${this.parent.name}/logs`
  },
  model: Log
})
