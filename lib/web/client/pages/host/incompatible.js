var HostPage = require('../host')
var templates = require('../../templates')
var config = require('clientconfig')

module.exports = HostPage.extend({
  template: templates.pages.host.incompatible,
  render: function () {
    this.renderWithTemplate({
      name: this.model.name,
      version: this.model.version,
      requiredVersion: config.minVersion
    }, templates.includes.host.incompatible)
  }
})
