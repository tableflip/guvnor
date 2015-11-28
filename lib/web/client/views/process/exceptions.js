var ProcessPage = require('../process')
var CollectionView = require('ampersand-collection-view')
var ExceptionView = require('./exceptions/entry')
var NoExceptionsView = require('./exceptions/empty')

module.exports = ProcessPage.extend({
  template: require('./exceptions.hbs'),
  subviews: {
    exceptions: {
      container: '[data-hook=exceptions]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.exceptions,
          view: ExceptionView,
          emptyView: NoExceptionsView
        })
      }
    }
  },
  bindings: {
    'model.areExceptionsPinned': {
      type: 'booleanClass',
      name: 'active',
      selector: '.exceptions-pin'
    }
  }
})
