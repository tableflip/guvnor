var AmpersandModel = require('ampersand-model')
var ansiHtml = require('ansi-html')
var moment = require('moment')

module.exports = AmpersandModel.extend({
  idAttribute: 'date',
  props: {
    type: ['info', 'warn', 'error', 'debug'],
    date: 'number',
    message: 'string'
  },
  session: {
    visible: ['boolean', true, true]
  },
  derived: {
    messageFormatted: {
      deps: ['message'],
      fn: function () {
        if (!this.message) {
          return ''
        }

        var message = this.message.replace(/</g, '&lt;')
        message = message.replace(/>/g, '&gt;')

        return ansiHtml(message)
      }
    },
    dateFormatted: {
      deps: ['date'],
      fn: function () {
        var date = new Date(this.date)

        return moment(date).format('YYYY-MM-DD HH:mm:ss Z')
      }
    }
  }
})
