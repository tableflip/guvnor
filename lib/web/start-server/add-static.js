var logger = require('winston')
var path = require('path')
var Inert = require('inert')

module.exports = function addStaticRoutes (server, callback) {
  logger.debug('Adding static routes')
  server.register(Inert, function () {})

  server.route({
    method: 'GET',
    path: '/images/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname + '/../client/public/images')
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
          path.resolve(__dirname + '/../client/public/fonts')
        ]
      }
    }
  })
  server.route({
    method: 'GET',
    path: '/apple-touch-icon.png',
    handler: function (request, reply) {
      reply.file(path.resolve(__dirname + '/../client/public/apple-touch-icon.png'))
    }
  })

  callback()
}
