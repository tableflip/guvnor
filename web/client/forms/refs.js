var FormView = require('ampersand-form-view')
var SelectView = require('ampersand-select-view')
var templates = require('../templates')

module.exports = FormView.extend({
  template: templates.includes.apps.refs,
  fields: function () {
    return [
      new SelectView({
        label: 'Ref',
        name: 'ref',
        value: this.model.ref,
        options: this.model.refs.map(function (ref) {
          return ref.name
        }),
        parent: this,
        template: templates.forms.controls.select()
      })
    ]
  }
})
