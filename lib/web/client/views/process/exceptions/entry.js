var View = require('ampersand-view')
var App = require('ampersand-app')
var $ = require('jquery')
var ConfirmView = require('../../confirm')
var notify = require('../../../helpers/notification')
var dom = require('ampersand-dom')

module.exports = View.extend({
  template: require('./entry.hbs'),
  bindings: {
    'model.visible': {
      type: 'booleanClass',
      selector: 'tr',
      name: 'visible'
    },
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
    'click ul': 'showDetails',
    'click [data-hook=removebutton]': 'removeException'
  },
  showDetails: function (event) {
    // the stack trace is contained in a code/pre element - if the user clicks that
    // they might be trying to copy the trace so only hide it if they've clicked
    // the surrounding list element(s)
    if (
      event.target.nodeName.toUpperCase() !== 'LI' &&
      event.target.nodeName.toUpperCase() !== 'UL') {
      return
    }

    var stack = this.query('.stack')

    if (dom.hasClass(stack, 'visible')) {
      dom.removeClass(stack, 'visible')
    } else {
      dom.addClass(stack, 'visible')
    }
  },
  removeException: function (event) {
    event.target.blur()

    var confirmView = new ConfirmView()
    confirmView.setMessage('Are you sure you want to remove this exception? This action cannot be undone.')

    App.modal.reset()
    App.modal.setTitle('Danger zone!')
    App.modal.setContent(confirmView)
    App.modal.setIsDanger(true)
    App.modal.setOkText('Remove')
    App.modal.setCallback(function () {
      this.model.isRemoving = true

      var exception = this.model
      var proc = exception.collection.parent
      var host = proc.collection.parent

      $.ajax({
        url: host.url + '/processes/' + proc.name + '/exceptions/' + exception.id,
        type: 'DELETE',
        success: function () {
          this.model.isRemoving = false

          notify({
            header: 'Exception removed',
            message: ['%s was removed from %s', this.model.messageOrStackSummary, host.name]
          })

          this.model.collection.remove(this.model)
        }.bind(this),
        error: function (request, type, error) {
          this.model.isRemoving = false

          notify({
            header: 'Error removing exception',
            message: ['Failed to remove %s from %s - %s', this.model.messageOrStackSummary, host.name, error],
            type: 'danger'
          })
        }.bind(this)
      })
    }.bind(this))
    App.modal.show()
  }
})
