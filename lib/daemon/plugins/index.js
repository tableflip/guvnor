'use strict'

const Boom = require('boom')

const plugins = (server) => {
  return Promise.all([
    './error-handler'
  ].map((pluginPath) => {
    return new Promise((resolve, reject) => {
      try {
        const plugin = require(pluginPath)

        server.register(plugin, error => {
          if (error) {
            return reject(error)
          }

          resolve()
        })
      } catch (error) {
        reject(error)
      }
    })
  }))
}


module.exports = plugins
