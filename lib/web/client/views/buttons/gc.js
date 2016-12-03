var View = require('ampersand-view')
var notify = require('../../helpers/notification')
var $ = require('jquery')

module.exports = View.extend({
  template: require('./gc.hbs'),
  bindings: {
    'model.isGc': [{
      type: 'booleanClass',
      no: 'fa-trash',
      selector: '[data-hook=gc-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-circle-o-notch',
      selector: '[data-hook=gc-process-button] i'
    }, {
      type: 'booleanClass',
      name: 'fa-spin',
      selector: '[data-hook=gc-process-button] i'
    }, {
      type: 'booleanAttribute',
      name: 'disabled',
      selector: '[data-hook=gc-process-button]'
    }]
  },
  events: {
    'click [data-hook=gc-process-button]': 'garbageCollectProcess'
  },
  garbageCollectProcess: function (event) {
    event.target.blur()

    this.model.isGc = true

    $.ajax({
      url: this.model.collection.parent.url + '/processes/' + this.model.name + '/gc',
      type: 'POST',
      xhrFields: {
        withCredentials: true
      },
      success: function () {
        this.model.isGc = false

        notify({
          header: 'Garbage collection complete',
          message: ['%s on %s has collected garbage', this.model.name, this.model.collection.parent.name],
          type: 'success'
        })
      }.bind(this),
      error: function (error) {
        this.model.isGc = false

        notify({
          header: 'Garbage collection error',
          message: ['%s on %s has failed to collect garbage - %s', this.model.name, this.model.collection.parent.name, error.message],
          type: 'danger'
        })
      }.bind(this)
    })
  }
})
