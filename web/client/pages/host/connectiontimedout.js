var HostPage = require('../host'),
  templates = require('../../templates')

module.exports = HostPage.extend({
  template: templates.includes.pages.connectiontimedout
})
