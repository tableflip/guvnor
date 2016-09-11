var Collection = require('ampersand-rest-collection')
var Ref = require('./ref')

module.exports = Collection.extend({
  url: function () {
    return this.parent.collection.parent.url + '/apps/' + this.parent.name + '/refs'
  },
  ajaxConfig: {
    xhrFields: {
      withCredentials: true
    }
  },
  model: Ref,
  mainIndex: 'name',
  comparator: 'name'
})
