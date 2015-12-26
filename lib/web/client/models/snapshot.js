var AmpersandModel = require('ampersand-model')
var prettysize = require('prettysize')
var moment = require('moment')

module.exports = AmpersandModel.extend({
  props: {
    id: 'string',
    date: 'number',
    path: 'string',
    size: 'number'
  },
  session: {
    isRemoving: ['boolean', true, false]
  },
  derived: {
    sizeFormatted: {
      deps: ['string'],
      fn: function () {
        return prettysize(this.size)
      }
    },
    dateFormatted: {
      deps: ['date'],
      fn: function () {
        var date = new Date(this.date)

        return moment(date).format('YYYY-MM-DD HH:mm:ss Z')
      }
    },
    file: {
      deps: ['path'],
      fn: function () {
        return this.path.split('/').pop()
      }
    }
  }
})
