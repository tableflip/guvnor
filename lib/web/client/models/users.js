var Collection = require('ampersand-rest-collection')
var User = require('./user')

module.exports = Collection.extend({
  url: function () {
    return this.parent.url + '/users'
  },
  ajaxConfig: {
    xhrFields: {
      withCredentials: true
    }
  },
  model: User,
  mainIndex: 'name',
  comparator: 'name',
  textAttribute: 'name'
})
