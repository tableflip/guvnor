
var clientConfig = {
  debugMode: true
}

module.exports = (server, callback) => {
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
      var clientConfig = JSON.parse(JSON.stringify(clientConfig))

      // add the auth
      clientConfig.auth = request.auth.credentials

      // encode the cookie
      cookie = encodeURIComponent(JSON.stringify(clientConfig))

      // set the cookie
      return reply(request.response.state('config', cookie))
    }

    return reply.continue()
  })

  callback()
}
