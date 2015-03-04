var PageView = require('./base')
var templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Guvnor - loading hosts',
  template: templates.pages.loadinghosts
})
