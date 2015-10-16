var PageView = require('./base')
var templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Guvnor - no hosts',
  template: templates.pages.nohosts
})
