var View = require('ampersand-view')
var templates = require('../templates')

module.exports = View.extend({
  template: templates.buttons.debug,
  events: {
    'click [data-hook=debugbutton]': 'debugProcess'
  },
  debugProcess: function (event) {
    event.target.blur()

    window.open('http://' +
      this.model.collection.parent.host +
      ':' +
      this.model.collection.parent.debuggerPort +
      '/debug?port=' +
      this.model.debugPort
    )
  }
})
