var ProcessPage = require('../process')
var templates = require('../../templates')
var StopButton = require('../../buttons/stop')

module.exports = ProcessPage.extend({
  template: templates.pages.process.starting,
  subviews: {
    stopButton: {
      container: '[data-hook=stopbutton]',
      prepareView: function (el) {
        return new StopButton({
          el: el,
          model: this.model
        })
      }
    }
  }
})
