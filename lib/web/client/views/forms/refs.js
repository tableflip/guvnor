var FormView = require('ampersand-form-view')
var SelectView = require('ampersand-select-view')

module.exports = FormView.extend({
  template: require('../host/apps/refs.hbs'),
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
        required: true,
        eagerValidate: true,
        template: require('./controls/select.hbs')
      })
    ]
  }
})
