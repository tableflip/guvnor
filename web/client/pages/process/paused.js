var ProcessPage = require('../process')
var templates = require('../../templates')

module.exports = ProcessPage.extend({
  template: templates.pages.process.paused,
  events: {
    'click button.process-debug': 'debugProcess'
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
