var PageView = require('./base'),
  templates = require('../templates')

module.exports = PageView.extend({
  pageTitle: 'Boss - no hosts',
  template: templates.pages.nohosts
})
