'use strict'

module.exports = (name, version, func) => {
  const plugin = {
    register: function (server, options, next) {
      func(server, options)

      next()
    }
  }
  plugin.register.attributes = {
    name: name,
    version: version
  }

  return plugin
}
