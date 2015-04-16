var View = require('ampersand-view')
var templates = require('../templates')
var notify = require('../helpers/notification')

module.exports = View.extend({
  template: templates.buttons.workeradd,
  bindings: {
    'model.canAddWorkers': {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=addworkerbutton]'
    }
  },
  events: {
    'click [data-hook=addworkerbutton]': 'addWorkerToCluster'
  },
  addWorkerToCluster: function (event) {
    event.target.blur()

    window.app.socket.emit('cluster:addworker', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      if (error) {
        notify({
          header: 'Add worker error',
          message: ['Could not add a worker to %s on %s - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }
    }.bind(this))
  }
})
