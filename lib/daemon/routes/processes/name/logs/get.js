'use strict'

const through2 = require('through2')
const context = require('../../../../lib/context')

const getProcessLogs = (request, reply) => {
  const stream = through2()
  const response = reply(stream).hold()

  request.server.methods.fetchProcessLogs(context(request), request.params.name, function (details) {
    response
      .header('Content-Type', 'text/plain')
      .header('Content-Length', details.size)
      .send()
  }, function (buffer) {
    stream.write(buffer)
  })
  .then(() => {
    stream.end()
  })
  .catch(error => {
    stream.end()

    throw error
  })
}

module.exports = {
  path: '/processes/{name}/logs',
  method: 'GET',
  handler: getProcessLogs,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
