var ProcessPage = require('../process')
var StopButton = require('../buttons/stop')

module.exports = ProcessPage.extend({
  template: require('./starting.hbs'),
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
