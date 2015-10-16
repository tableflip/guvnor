var View = require('ampersand-view')
var templates = require('../templates')
var ConfirmView = require('../views/confirm')

module.exports = View.extend({
  template: templates.buttons.remove,
  bindings: {
    'model.isRemoving': [{
      type: 'booleanClass',
      no: 'fa-remove',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=removebutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=removebutton]'
    }]
  },
  events: {
    'click [data-hook=removebutton]': 'removeProcess'
  },
  removeProcess: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this process? This action cannot be undone.')

    window.app.modal.reset()
    window.app.modal.setTitle('Danger zone!')
    window.app.modal.setContent(confirmView)
    window.app.modal.setIsDanger(true)
    window.app.modal.setOkText('Remove')
    window.app.modal.setCallback(function () {
      this.model.isRemoving = true

      window.app.socket.emit('process:remove', {
        host: this.model.collection.parent.name,
        process: this.model.id
      }, function () {
      })
    }.bind(this))
    window.app.modal.show()
  }
})
