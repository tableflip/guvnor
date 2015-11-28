var PageView = require('./base')

module.exports = PageView.extend({
  pageTitle: 'Guvnor - loading hosts',
  template: require('./loading-hosts.hbs')
})
