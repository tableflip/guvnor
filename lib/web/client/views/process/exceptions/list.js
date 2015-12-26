var View = require('ampersand-view')
var CollectionView = require('ampersand-collection-view')
var App = require('ampersand-app')
var $ = require('jquery')
var ConfirmView = require('../../confirm')
var notify = require('../../../helpers/notification')
var ExceptionView = require('./entry')
var NoExceptionsView = require('./empty')

module.exports = View.extend({
  template: require('./list.hbs'),
  subviews: {
    exceptions: {
      container: '[data-hook=exceptions]',
      prepareView: function (el) {
        return new CollectionView({
          el: el,
          collection: this.model.exceptions,
          view: ExceptionView,
          emptyView: NoExceptionsView
        })
      }
    }
  },
  bindings: {
    'model.areExceptionsPinned': {
      type: 'booleanClass',
      name: 'active',
      selector: '.exceptions-pin'
    },
    'model.exceptions.isRemoving': [{
      type: 'booleanClass',
      no: 'fa-remove',
      selector: '[data-hook=clearbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=clearbutton] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=clearbutton] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=clearbutton]'
    }]
  },
  events: {
    'click [data-hook=clearbutton]': 'clearList'
  },
  clearList: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove all exceptions? This action cannot be undone.')

    App.modal.reset()
    App.modal.setTitle('Danger zone!')
    App.modal.setContent(confirmView)
    App.modal.setIsDanger(true)
    App.modal.setOkText('Remove')
    App.modal.setCallback(function () {
      this.model.exceptions.isRemoving = true

      var proc = this.model
      var host = proc.collection.parent

      $.ajax({
        url: host.url + '/processes/' + proc.name + '/exceptions',
        type: 'DELETE',
        success: function () {
          this.model.exceptions.isRemoving = false

          notify({
            header: 'Exceptions cleared',
            message: ['All exceptions were cleared from %s', host.name]
          })

          this.model.exceptions.reset([])
        }.bind(this),
        error: function (request, type, error) {
          this.model.exceptions.isRemoving = false

          notify({
            header: 'Error clearing exceptions',
            message: ['Failed to remove exceptions from %s - %s', host.name, error],
            type: 'danger'
          })
        }.bind(this)
      })
    }.bind(this))
    App.modal.show()
  }
})
