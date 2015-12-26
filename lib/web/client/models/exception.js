var AmpersandModel = require('ampersand-model')
var moment = require('moment')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    date: 'number',
    message: ['string', false, '-'],
    code: ['string', false, '-'],
    stack: 'string'
  },
  session: {
    visible: ['boolean', true, true],
    isRemoving: ['boolean', true, false]
  },
  derived: {
    dateFormatted: {
      deps: ['date'],
      fn: function (value) {
        return moment(value).format('YYYY-MM-DD HH:mm:ss Z')
      }
    },
    messageOrStackSummary: {
      deps: ['message', 'stack'],
      fn: function () {
        if (this.message) {
          return this.message
        }

        // return first line of stacktrace
        return this.stack.substring(0, this.stack.indexOf('\n'))
      }
    }
  }
})
