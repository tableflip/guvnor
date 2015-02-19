var PageView = require('./base'),
  templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Guvnor - loading hosts',
  template: templates.pages.loadinghosts
})
