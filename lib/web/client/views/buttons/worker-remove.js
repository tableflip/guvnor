var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var app = require('ampersand-app')

module.exports = View.extend({
  template: require('./worker-remove.hbs'),
  events: {
    'click [data-hook=removeworkerbutton]': 'removeWorkerFromCluster'
  },
  removeWorkerFromCluster: function (event) {
    event.target.blur()

    app.socket.emit('cluster:removeworker', {
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
