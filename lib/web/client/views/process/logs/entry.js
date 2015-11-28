var View = require('ampersand-view')

module.exports = View.extend({
  template: require('./entry.hbs'),
  bindings: {
    'model.visible': {
      type: 'booleanClass',
      selector: 'li',
      name: 'visible'
    }
  }
})
