var View = require('ampersand-view')
var ConfirmView = require('../../confirm')

module.exports = View.extend({
  template: require('./entry.hbs'),
  bindings: {
    'model.dateFormatted': '[data-hook=date]',
    'model.path': '[data-hook=path]',
    'model.sizeFormatted': '[data-hook=size]'
  },
  events: {
    'click [data-hook=downloadbutton]': 'downloadSnapshot',
    'click [data-hook=removebutton]': 'removeSnapshot'
  },
  downloadSnapshot: function (event) {
    event.target.blur()

    window.location = this.collection.url() + '/' + this.model.id
  },
  removeSnapshot: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this snapshot? This action cannot be undone.')

    window.app.modal.reset()
    window.app.modal.setTitle('Danger zone!')
    window.app.modal.setContent(confirmView)
    window.app.modal.setIsDanger(true)
    window.app.modal.setOkText('Remove')
    window.app.modal.setCallback(function () {
      this.model.isRemoving = true

      window.app.socket.emit('process:snapshot:remove', {
        host: this.parent.collection.parent.collection.parent.name,
        process: this.parent.collection.parent.id,
        snapshot: this.model.id
      }, function () {})
    }.bind(this))
    window.app.modal.show()
  }
})
