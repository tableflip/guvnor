var View = require('ampersand-view')
var SystemDataView = require('../../views/host/system')
var ResourceDataView = require('../../views/host/resources')

module.exports = View.extend({
  template: require('./connected.hbs'),
  subviews: {
    system: {
      container: '[data-hook=system]',
      prepareView: function (el) {
        return new SystemDataView({
          model: this.model,
          el: el
        })
      }
    },
    resources: {
      container: '[data-hook=resources]',
      prepareView: function (el) {
        return new ResourceDataView({
          model: this.model,
          el: el
        })
      }
    }
  }
})
