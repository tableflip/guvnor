'use strict'

const through2 = require('through2')
const path = require('path')
const context = require('../../../../../lib/context')

const getHeapSnapshot = (request, reply) => {
  const stream = through2()
  const response = reply(stream).hold()

  let sent = false

  return request.server.methods.fetchHeapSnapshot(context(request), request.params.name, request.params.id, function (details) {
    response
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename=${path.basename(details.path)}`)
      .header('Content-Length', details.size)
      .send()

    sent = true
  }, function (buffer) {
    stream.write(buffer)
  })
  .catch(error => {
    stream.write(JSON.stringify(error.output.payload))
  })
  .then(() => {
    if (!sent) {
      response.send()
    }

    stream.end()
  })
}

module.exports = {
  path: '/processes/{name}/heapsnapshots/{id}',
  method: 'GET',
  handler: getHeapSnapshot,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
