require('bootstrap-notify')
var jQuery = require('jquery')

var sprintf = require('sprintf-js').sprintf

module.exports = function (options) {
  if (!Array.isArray(options.message)) {
    options.message = [options.message]
  }

  jQuery.notify('<h4>' + options.header + '</h4>' + sprintf.apply(null, options.message), {
    type: options.type ? options.type : 'info',
    offset: 15
  })
}
