require('bootstrap-growl')

var sprintf = require('sprintf-js').sprintf

module.exports = function(options) {
  if(!Array.isArray(options.message)) {
    options.message = [options.message]
  }

  window.$.growl('<h4>' + options.header + '</h4>' + sprintf.apply(null, options.message), {
    type: options.type ? options.type : 'info',
    offset: 15
  })
}
