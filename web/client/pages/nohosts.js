var PageView = require('./base'),
  templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Guvnor - no hosts',
  template: templates.pages.nohosts
})
