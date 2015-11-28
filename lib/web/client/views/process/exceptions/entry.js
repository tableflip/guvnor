var View = require('ampersand-view')
var dom = require('ampersand-dom')

module.exports = View.extend({
  template: require('./entry.hbs'),
  bindings: {
    'model.visible': {
      type: 'booleanClass',
      selector: 'tr',
      name: 'visible'
    }
  },
  events: {
    'click ul': 'showDetails'
  },
  showDetails: function (event) {
    // the stack trace is contained in a code/pre element - if the user clicks that
    // they might be trying to copy the trace so only hide it if they've clicked
    // the surrounding list element(s)
    if (
      event.target.nodeName.toUpperCase() !== 'LI' &&
      event.target.nodeName.toUpperCase() !== 'UL') {
      return
    }

    var stack = this.query('.stack')

    if (dom.hasClass(stack, 'visible')) {
      dom.removeClass(stack, 'visible')
    } else {
      dom.addClass(stack, 'visible')
    }
  }
})
