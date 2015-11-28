var View = require('ampersand-view')
var GcButton = require('../../buttons/gc')
var DebugButton = require('../../buttons/debug')
var RestartButton = require('../../buttons/restart')
var StopButton = require('../../buttons/stop')
var AddWorkerButton = require('../../buttons/worker-add')
var RemoveWorkerButton = require('../../buttons/worker-remove')

module.exports = View.extend({
  template: require('./running.hbs'),
  bindings: {
    'model.pid': '[data-hook=pid]',
    'model.user': '[data-hook=user]',
    'model.group': '[data-hook=group]',
    'model.uptimeFormatted': '[data-hook=uptime]',
    'model.restarts': '[data-hook=restarts]',
    'model.isPaused': {
      type: 'toggle',
      yes: '[data-hook=debugger-warning]',
      no: '[data-hook=running-information]'
    }
  },
  subviews: {
    gcButton: {
      container: '[data-hook=gcbutton]',
      prepareView: function (el) {
        return new GcButton({
          el: el,
          model: this.model
        })
      }
    },
    debugButton: {
      container: '[data-hook=debugbutton]',
      prepareView: function (el) {
        return new DebugButton({
          el: el,
          model: this.model
        })
      }
    },
    restartButton: {
      container: '[data-hook=restartbutton]',
      prepareView: function (el) {
        return new RestartButton({
          el: el,
          model: this.model
        })
      }
    },
    stopButton: {
      container: '[data-hook=stopbutton]',
      prepareView: function (el) {
        return new StopButton({
          el: el,
          model: this.model
        })
      }
    },
    addWorkerButton: {
      container: '[data-hook=addworkerbutton]',
      prepareView: function (el) {
        return new AddWorkerButton({
          el: el,
          model: this.model
        })
      }
    },
    removeWorkerButton: {
      container: '[data-hook=removeworkerbutton]',
      prepareView: function (el) {
        return new RemoveWorkerButton({
          el: el,
          model: this.model
        })
      }
    }
  }
})
