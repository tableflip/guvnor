var logger = require('winston')
var path = require('path')

module.exports = function addStaticRoutes (server, callback) {
  logger.debug('Adding static routes')

  server.route({
    method: 'GET',
    path: '/images/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname + '/../public/images')
      }
    }
  })
  server.route({
    method: 'GET',
    path: '/fonts/{param*}',
    handler: {
      directory: {
        path: [
          path.resolve(__dirname + '/../../../node_modules/bootstrap-material-design/dist/fonts'),
          path.resolve(__dirname + '/../public/fonts')
        ]
      }
    }
  })
  server.route({
    method: 'GET',
    path: '/apple-touch-icon.png',
    handler: function (request, reply) {
      reply.file(path.resolve(__dirname + '/../public/apple-touch-icon.png'))
    }
  })

  callback()
}
