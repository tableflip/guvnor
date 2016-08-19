'use strict'

const Joi = require('joi')
const outputStream = require('../../../lib/output-stream')
const context = require('../../../lib/context')

const setAppRef = (request, reply) => {
  const stream = outputStream()
  reply(stream)

  return request.server.methods.setAppRef(context(request), request.params.name, request.payload.ref, stream)
  .then(app => {
    stream.done(null, app)
  })
  .catch(error => {
    stream.done(error)

    throw error
  })
}

module.exports = {
  path: '/apps/{name}',
  method: 'PATCH',
  handler: setAppRef,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      payload: {
        ref: Joi.string().required().trim()
      }
    }
  }
}
