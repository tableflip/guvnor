var HostPage = require('../host'),
  templates = require('../../templates'),
  config = require('clientconfig')

module.exports = HostPage.extend({
  template: templates.pages.host.incompatible,
  render: function() {
    this.renderWithTemplate({
      name: this.model.name,
      version: this.model.version,
      requiredVersion: config.minVersion
    }, templates.includes.host.incompatible)
  }
})
