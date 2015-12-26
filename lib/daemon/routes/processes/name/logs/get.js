var Boom = require('boom')
var through2 = require('through2')
var path = require('path')

module.exports = function getProcessLogs (server, callback) {
  server.route({
    path: '/processes/{name}/logs',
    method: 'GET',
    handler: function getProcessLogsHandler (request, reply) {
      var stream = through2()
      var response = reply(stream).hold()
      var sent = false

      request.server.methods.fetchProcessLogs({
        user: request.auth.credentials,
        log: request.log.bind(request)
      }, request.params.name, function (details) {
        response
          .header('Content-Type', 'text/plain')
          .header('Content-Length', details.size)
          .send()

        sent = true
      }, function (buffer) {
        stream.write(buffer)
      }, function (error) {
        if (error) {
          if (error && error.code === 'ENOPROC') {
            error = Boom.notFound('No process found for ' + request.params.name)
          } else {
            error = Boom.wrap(error)
          }
        }

        if (!sent) {
          if (error) {
            response.statusCode = error.output.statusCode
          }

          response.send()
        }

        if (error) {
          stream.write(JSON.stringify(error.output.payload))
        }

        stream.end()
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      }
    }
  })

  callback()
}
