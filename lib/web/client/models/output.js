var Model = require('ampersand-model')

module.exports = Model.extend({
  props: {
    preview: 'string',
    text: 'string',
    errorHeader: 'string',
    errorMessage: 'string',
    successHeader: 'string',
    successMessage: 'string'
  }
})
