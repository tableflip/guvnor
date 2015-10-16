var View = require('ampersand-view')
var templates = require('../templates')
var notify = require('../helpers/notification')

module.exports = View.extend({
  template: templates.buttons.gc,
  bindings: {
    'model.isGc': [{
      type: 'booleanClass',
      no: 'fa-trash',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=gcbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=gcbutton]'
    }]
  },
  events: {
    'click [data-hook=gcbutton]': 'garbageCollectProcess'
  },
  garbageCollectProcess: function (event) {
    event.target.blur()

    this.model.isGc = true

    window.app.socket.emit('process:gc', {
      host: this.model.collection.parent.name,
      process: this.model.id
    }, function (error) {
      this.model.isGc = false

      if (error) {
        notify({
          header: 'Garbage collection error',
          message: ['%s on %s has failed to collect garbage - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      } else {
        notify({
          header: 'Garbage collection complete',
          message: ['%s on %s has collected garbage', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }
    }.bind(this))
  }
})
