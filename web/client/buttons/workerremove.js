var View = require('ampersand-view')
var templates = require('../templates')
var notify = require('../helpers/notification')

module.exports = View.extend({
  template: templates.buttons.workerremove,
  events: {
    'click [data-hook=removeworkerbutton]': 'removeWorkerFromCluster'
  },
  removeWorkerFromCluster: function (event) {
    event.target.blur()

    window.app.socket.emit('cluster:removeworker', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      if (error) {
        notify({
          header: 'Remove worker error',
          message: ['Could not remove a worker from %s on %s - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }
    }.bind(this))
  }
})
