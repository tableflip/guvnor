var View = require('ampersand-view')
var FormView = require('ampersand-form-view')
var SelectView = require('ampersand-select-view')
var App = require('ampersand-app')

var RefsForm = FormView.extend({
  fields: function () {
    return [
      new SelectView({
        label: 'Choose a ref',
        name: 'ref',
        value: this.model.ref.name,
        options: this.model.refs.map(function (ref) {
          return ref.name
        }),
        parent: this,
        required: true,
        eagerValidate: true,
        template: '<div class="form-group">' +
          '<label data-hook="label"></label>' +
          '<select class="form-control"></select>' +
          '<div data-hook="message-container">' +
            '<div class="alert alert-danger" data-hook="message-text"></div>' +
          '</div>' +
        '</div>'
      })
    ]
  }
})

module.exports = View.extend({
  template: require('./refs.hbs'),
  initialize: function (options) {
    this.onSubmit = options.onSubmit
  },
  events: {
    'click [data-hook=cancel-button]': 'onCancel'
  },
  subviews: {
    form: {
      container: 'form',
      prepareView: function (el) {
        return new RefsForm({
          model: this.model,
          el: el,
          submitCallback: function (data) {
            this.onSubmit(data)
          }.bind(this)
        })
      }
    }
  },
  onCancel: function () {
    App.router.redirectTo('/host/' + this.model.collection.parent.name + '/apps')
  }
})
