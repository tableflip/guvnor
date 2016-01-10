var PageView = require('./base')

module.exports = PageView.extend({
  pageTitle: 'Loading hosts',
  template: require('./loading-hosts.hbs')
})
