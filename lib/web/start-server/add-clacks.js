var logger = require('winston')

module.exports = function addClacks (server, callback) {
  logger.debug('Adding clacks')

  server.ext('onPreResponse', function setClacksOverhead (request, reply) {
    if (request.response instanceof Error) {
      return reply.continue()
    }

    // http://np.reddit.com/r/discworld/comments/2yt9j6/gnu_terry_pratchett/
    request.response.header('X-Clacks-Overhead', 'GNU Terry Pratchett')

    return reply.continue()
  })

  callback()
}
