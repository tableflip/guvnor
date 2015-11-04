var Collection = require('ampersand-collection')
var Host = require('./host')

module.exports = Collection.extend({
  mainIndex: 'url',
  model: Host,
  comparator: 'hostname'
})
