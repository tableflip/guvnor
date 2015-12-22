var Boom = require('boom')
var through2 = require('through2')
var path = require('path')

module.exports = function getHeapSnapshot (server, callback) {
  server.route({
    path: '/processes/{name}/heapsnapshots/{id}',
    method: 'GET',
    handler: function getHeapSnapshotHandler (request, reply) {
      var stream = through2()
      var response = reply(stream).hold()

      request.server.methods.fetchHeapSnapshot(request.auth.credentials, request.params.name, request.params.id, function (details) {
        response
          .header('Content-Type', 'application/octet-stream')
          .header('Content-Disposition', 'attachment; filename=' + path.basename(details.path))
          .header('Content-Length', details.size)
          .send()
      }, function (buffer) {
        stream.write(buffer)
      }, function (error) {
        if (error) {
          if (error && error.code === 'ENOPROC') {
            error = Boom.notFound('No process found for ' + request.params.name)
          } else if (error && error.code === 'ENOHEAP') {
            error = Boom.notFound('No snapshot found for ' + request.params.id)
          } else {
            error = Boom.wrap(error)
          }

          response.statusCode = error.output.statusCode
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
