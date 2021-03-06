var View = require('ampersand-view')
var templates = require('../../../templates')

module.exports = View.extend({
  template: templates.includes.process.loglist.entry,
  bindings: {
    'model.visible': {
      type: 'booleanClass',
      selector: 'li',
      name: 'visible'
    }
  }
})
