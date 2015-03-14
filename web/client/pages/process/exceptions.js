var ProcessPage = require('../process')
var templates = require('../../templates')
var CollectionView = require('ampersand-collection-view')
var ExceptionView = require('../../views/process/exceptionlist/entry')
var NoExceptionsView = require('../../views/process/exceptionlist/empty')

module.exports = ProcessPage.extend({
  template: templates.pages.process.exceptions,
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
