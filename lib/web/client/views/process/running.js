var View = require('ampersand-view')
var DetailsView = require('../../views/process/overview')
var MemoryGraphView = require('../../views/process/overview/memory')
var CpuGraphView = require('../../views/process/overview/cpu')
var LatencyGraphView = require('../../views/process/overview/latency')

module.exports = View.extend({
  pageTitle: function () {
    return 'Guvnor - ' + this.model.name + ' - ' + this.model.status
  },
  template: require('./running.hbs'),
  subviews: {
    details: {
      container: '[data-hook=details]',
      prepareView: function (el) {
        return new DetailsView({
          model: this.model,
          el: el
        })
      }
    }/*,
    memory: {
      container: '[data-hook=memory]',
      prepareView: function (el) {
        return new MemoryGraphView({
          model: this.model,
          el: el
        })
      }
    },
    cpu: {
      container: '[data-hook=cpu]',
      prepareView: function (el) {
        return new CpuGraphView({
          model: this.model,
          el: el
        })
      }
    },
    latency: {
      container: '[data-hook=latency]',
      prepareView: function (el) {
        return new LatencyGraphView({
          model: this.model,
          el: el
        })
      }
    }*/
  }
})
