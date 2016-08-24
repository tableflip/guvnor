'use strict'

const through2 = require('through2')
const path = require('path')
const context = require('../../../../../lib/context')

const getHeapSnapshot = (request, reply) => {
  const stream = through2()
  const response = reply(null, stream).hold()

  let sent = false

  request.server.methods.fetchHeapSnapshot(context(request), request.params.name, request.params.id, (details) => {
    response
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename=${path.basename(details.path)}`)
      .header('Content-Length', details.size)
      .send()

    sent = true
  }, (buffer) => {
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
    },
    plugins: {
      'error-handler': {
        'ENOHEAP': (request) => {
          return {
            code: 404,
            message: `No snapshot found for ${request.params.id}`
          }
        }
      }
    }
  }
}
