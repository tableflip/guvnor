var View = require('ampersand-view')

module.exports = View.extend({
  template: '<div data-hook="alert" class="alert" role="alert">' +
      '<h4 data-hook="title">I am a title</h4>' +
      '<p><i data-hook="spinner" class="fa fa-circle-o-notch fa-spin"></i> <span data-hook="message">I am a message</span></p>' +
    '</div>',
  bindings: {
    'model.typeClass': {
      type: 'class',
      hook: 'alert'
    },
    'model.indeterminate': {
      type: 'toggle',
      hook: 'spinner'
    },
    'model.message': {
      type: 'text',
      hook: 'message'
    },
    'model.title': {
      type: 'text',
      hook: 'title'
    }
  }
})
