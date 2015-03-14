var ProcessPage = require('../process')
var templates = require('../../templates')
var StartOrRemoveView = require('../../views/process/startOrRemove')

module.exports = ProcessPage.extend({
  template: templates.pages.process.failed,
  subviews: {
    startOrRemove: {
      container: '[data-hook=startOrRemove]',
      prepareView: function (el) {
        return new StartOrRemoveView({
          model: this.model,
          el: el
        })
      }
    }
  }
})
