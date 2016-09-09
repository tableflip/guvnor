'use strict'

const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'web:start-server:add-clacks'

const addClacks = (context, server) => {
  return new Promise((resolve, reject) => {
    context.log([DEBUG, CONTEXT], 'Adding clacks')

    server.ext('onPreResponse', (request, reply) => {
      if (request.response instanceof Error) {
        return reply.continue()
      }

      // http://np.reddit.com/r/discworld/comments/2yt9j6/gnu_terry_pratchett/
      request.response.header('X-Clacks-Overhead', 'GNU Terry Pratchett')

      return reply.continue()
    })

    resolve()
  })
}

module.exports = addClacks
