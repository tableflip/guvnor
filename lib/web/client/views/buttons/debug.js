var View = require('ampersand-view')

module.exports = View.extend({
  template: require('./debug.hbs'),
  events: {
    'click [data-hook=debug-process-button]': 'debugProcess'
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
