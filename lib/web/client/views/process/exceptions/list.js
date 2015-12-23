var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var ExceptionView = require('./entry')
var NoExceptionsView = require('./empty')

module.exports = View.extend({
  template: require('./list.hbs'),
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
