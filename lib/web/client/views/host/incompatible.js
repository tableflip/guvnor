var View = require('ampersand-view')
var config = require('clientconfig')

module.exports = View.extend({
  template: require('./incompatible.hbs'),
  render: function () {
    this.renderWithTemplate({
      name: this.model.name,
      version: this.model.version,
      requiredVersion: config.minVersion
    })
  }
})
