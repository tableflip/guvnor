var View = require('ampersand-view')

module.exports = View.extend({
  template: require('./logs.hbs'),
  events: {
    'click button.logs-time': 'toggleTimes',
    'click button.logs-pin': 'pinLogs',
    'click button.logs-clear': 'clearLogs'
  },
  pinLogs: function (event) {
    this.model.areLogsPinned = !this.model.areLogsPinned
  },
  clearLogs: function (event) {
    this.model.logs = ''
  },
  scrollLogs: function () {
    setTimeout(function () {
      if (!this.model.areLogsPinned) {
        var list = this.query('[data-hook=logs]')

        if (!list) {
          return
        }

        list.scrollTop = list.scrollHeight
      }
    }.bind(this), 100)
  },
  bindings: {
    'model.areLogsPinned': {
      type: 'booleanClass',
      name: 'active',
      selector: '.logs-pin'
    },
    'model.logs': [{
      type: 'text',
      selector: '[data-hook=logs]'
    }, {
      type: function () {
        this.scrollLogs()
      },
      selector: '[data-hook=logs]'
    }]
  }
})
