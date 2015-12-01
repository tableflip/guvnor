var App = require('ampersand-app')
var View = require('ampersand-view')
var StartForm = require('../../../forms/start')
var StartModel = require('../../../../models/start')
var $ = require('jquery')

module.exports = View.extend({
  template: '<div>' +
    '<h3>Start <span data-hook="app-name">My Process</span></h3>' +
    '<form data-hook="start-form" class="start-form">' +
      '<field-container data-hook="field-container"></field-container>' +
      '<div class="buttons">' +
        '<button class="btn btn-default" data-hook="cancel-button" type="button">Cancel</button> ' +
        '<button class="btn btn-success" data-hook="submit-button" type="submit">Start</button>' +
      '</div>' +
    '</form>' +
  '</div>',
  bindings: {
    'model.name': {
      type: 'text',
      hook: 'app-name'
    }
  },
  subviews: {
    form: {
      prepareView: function (el) {
        return new StartForm({
          el: el,
          model: new StartModel({
            user: this.model.user,
            group: this.model.group,
            name: this.model.name
          }),
          submitCallback: this.startApp.bind(this)
        })
      },
      hook: 'start-form'
    }
  },
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  onCancel: function () {
    App.router.redirectTo('/host/' + this.model.collection.parent.name + '/apps')
  },
  startApp: function (data) {
    data.script = this.model.name
    data.argv = (data.argv || '').trim().split(' ').filter(function (arg) {
      return arg
    })
    data.execArgv = (data.execArgv || '').trim().split(' ').filter(function (arg) {
      return arg
    })
    data.instances = parseInt(data.instances, 10)

    delete data.user

    $.ajax({
      type: 'post',
      url: App.host.url + '/processes',
      data: data,
      success: function () {
        App.router.redirectTo('/host/' + this.model.collection.parent.name + '/processes')
      }.bind(this)
    })
  }
})
