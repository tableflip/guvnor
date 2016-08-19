'use strict'

const plugin = require('./plugin')

module.exports = (name, version, event, handler) => {
  return plugin('errorHandler', '1.0.0', 'onPreResponse', (server, options) => {
    server.ext(event, handler)
  })
}
