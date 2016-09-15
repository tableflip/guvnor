'use strict'

const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'web:start-server:add-client-config'
const config = require('../config')

const clientConfig = {
  debugMode: true,
  DAEMON_NAME: config.DAEMON_NAME
}

const addClientConfig = (context, server) => {
  context.log([DEBUG, CONTEXT], 'Adding client config')

  return new Promise((resolve, reject) => {
    server.state('config', {
      ttl: null,
      isSecure: false,
      encoding: 'none'
    })

    server.ext('onPreResponse', (request, reply) => {
      if (request.response instanceof Error) {
        return reply.continue()
      }

      var cookie

      if (request.state && request.state.config) {
        try {
          cookie = JSON.parse(decodeURIComponent(request.state.config))
        } catch (error) {
          // don't care if the cookie is invalid
        }
      }

      if (!cookie || !cookie.auth) {
        // copy the client config
        var config = JSON.parse(JSON.stringify(clientConfig))

        // add the auth
        config.auth = request.auth.credentials

        // encode the cookie
        cookie = encodeURIComponent(JSON.stringify(config))

        // set the cookie
        return reply(request.response.state('config', cookie))
      }

      return reply.continue()
    })

    resolve()
  })
}

module.exports = addClientConfig
