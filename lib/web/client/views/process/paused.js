var ProcessPage = require('../process')

module.exports = ProcessPage.extend({
  template: require('./paused.hbs'),
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
