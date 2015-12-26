var View = require('ampersand-view')
var App = require('ampersand-app')
var $ = require('jquery')
var ConfirmView = require('../../confirm')
var notify = require('../../../helpers/notification')

module.exports = View.extend({
  template: require('./entry.hbs'),
  bindings: {
    'model.dateFormatted': '[data-hook=date]',
    'model.file': '[data-hook=path]',
    'model.sizeFormatted': '[data-hook=size]',
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

    App.modal.reset()
    App.modal.setTitle('Danger zone!')
    App.modal.setContent(confirmView)
    App.modal.setIsDanger(true)
    App.modal.setOkText('Remove')
    App.modal.setCallback(function () {
      this.model.isRemoving = true

      var host = this.model.collection.parent

      $.ajax({
        url: this.model.collection.parent.collection.parent.url + '/processes/' + this.model.collection.parent.name + '/heapsnapshots/' + this.model.id,
        type: 'DELETE',
        success: function () {
          this.model.isRemoving = false

          notify({
            header: 'Snapshot removed',
            message: ['%s was removed from %s', this.model.name, host.name]
          })

          this.model.collection.remove(this.model)
        }.bind(this),
        error: function (request, type, error) {
          this.model.isRemoving = false

          notify({
            header: 'Error removing snapshot',
            message: ['Failed to remove %s from %s - %s', this.model.name, host.name, error],
            type: 'danger'
          })
        }.bind(this)
      })
    }.bind(this))
    App.modal.show()
  }
})
