var ProcessPage = require('../process')
var templates = require('../../templates')
var CollectionRenderer = require('ampersand-collection-view')
var ExceptionView = require('../../views/process/exceptionlist/entry')

module.exports = ProcessPage.extend({
  template: templates.pages.process.exceptions,
  initialize: function () {
    ProcessPage.prototype.initialize.call(this)

    this.listenTo(this.model.exceptions, 'add', function () {
      if (this.model.exceptions.length === 1) {
        // if length == 1 then the list used to be empty so call render to remove
        // the 'nothing to show' message and show the list instead
        this.render()
      }
    })
  },
  subviews: {
    exceptions: {
      container: '[data-hook=exceptions]',
      prepareView: function (el) {
        return new CollectionRenderer({
            el: el,
            collection: this.model.exceptions,
            view: ExceptionView
          })
      }
    }
  },
  bindings: {
    'model.areExceptionsPinned': {
      type: 'booleanClass',
      name: 'active',
      selector: '.exceptions-pin'
    },
    'model.exceptions.length': {
      type: 'toggle',
      no: '[data-hook=no-exceptions]',
      yes: '[data-hook=exception-list]'
    }
  }
})
