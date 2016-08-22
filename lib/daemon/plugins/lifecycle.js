'use strict'

const plugin = require('./plugin')

module.exports = (name, version, event, handler) => {
  return plugin(name, version, (server, options) => {
    server.ext(event, handler)
  })
}
