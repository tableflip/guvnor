var Collection = require('ampersand-rest-collection')
var User = require('./user')

module.exports = Collection.extend({
  url: function () {
    return '/hosts/' + this.parent.name + '/users'
  },
  model: User,
  mainIndex: 'name',
  comparator: 'name',
  textAttribute: 'name'
})
