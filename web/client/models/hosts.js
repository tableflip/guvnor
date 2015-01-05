var Collection = require('ampersand-collection'),
  Host = require('./host');

module.exports = Collection.extend({
  mainIndex: 'name',
  model: Host,
  comparator: 'name'
})
