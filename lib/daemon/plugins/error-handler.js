'use strict'

const Boom = require('boom')
const lifecycle = require('./lifecycle')
const ERROR = require('good-enough').ERROR
const CONTEXT = 'daemon:plugins:error-handler'

const errorHandler = (request, reply) => {
  const response = request.response

  if (!(response instanceof Error)) {
    return reply()
  }

  let error = response

  if (response.code === 'ENOAPP') {
    error = Boom.notFound(`No app found with name ${request.params.name}`)
  } else if (error.code === 'ENOPACKAGE.JSON') {
    error = Boom.preconditionFailed('No package.json found in repository')
  } else if (error.code === 'EAPPEXIST' || error.code === 'ENOTEMPTY') {
    error = Boom.conflict('An app with that name already exists')
  } else if (error && error.code === 'ENOPROC') {
    error = Boom.notFound(`No process found for ${request.params.name}`)
  } else if (error.code === 'ERUNNING') {
    return reply(Boom.conflict(`Process ${request.params.name} is already running`))
  } else if (error.code === 'EEXIST') {
    return done(reply, Boom.conflict(error.message))
  } else {
    error = Boom.wrap(error)
  }

  request.log([ERROR, CONTEXT], error)

  reply(error)
}

module.exports = lifecycle('errorHandler', '1.0.0', 'onPreResponse', errorHandler)
