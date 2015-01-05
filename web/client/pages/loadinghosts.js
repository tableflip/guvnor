var PageView = require('./base'),
  templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Boss - loading hosts',
  template: templates.pages.loadinghosts
})
