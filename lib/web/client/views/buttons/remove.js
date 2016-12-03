var View = require('ampersand-view')
var ConfirmView = require('../confirm')
var app = require('ampersand-app')

module.exports = View.extend({
  template: require('./remove.hbs'),
  bindings: {
    'model.isRemoving': [{
      type: 'booleanClass',
      no: 'fa-remove',
      selector: '[data-hook=remove-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=remove-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=remove-process-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=remove-process-button]'
    }]
  },
  events: {
    'click [data-hook=remove-process-button]': 'removeProcess'
  },
  removeProcess: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this process? This action cannot be undone.')

    app.modal.reset()
    app.modal.setTitle('Danger zone!')
    app.modal.setContent(confirmView)
    app.modal.setIsDanger(true)
    app.modal.setOkText('Remove')
    app.modal.setCallback(function () {
      this.model.isRemoving = true

      app.socket.emit('process:remove', {
        host: this.model.collection.parent.name,
        process: this.model.id
      }, function () {
      })
    }.bind(this))
    app.modal.show()
  }
})
