var HostPage = require('../host')
var templates = require('../../templates')

module.exports = HostPage.extend({
  template: templates.pages.host.timeout
})
