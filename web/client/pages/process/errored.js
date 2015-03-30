var ProcessPage = require('../process')
var templates = require('../../templates')
var StartButton = require('../../buttons/start')
var RemoveButton = require('../../buttons/remove')

module.exports = ProcessPage.extend({
  template: templates.pages.process.errored,
  subviews: {
    startButton: {
      container: '[data-hook=startbutton]',
      prepareView: function (el) {
        return new StartButton({
          el: el,
          model: this.model
        })
      }
    },
    removeButton: {
      container: '[data-hook=removebutton]',
      prepareView: function (el) {
        return new RemoveButton({
          el: el,
          model: this.model
        })
      }
    }
  }
})
