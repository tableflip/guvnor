'use strict'

const Boom = require('boom')
const lifecycle = require('./lifecycle')
const ERROR = require('good-enough').ERROR
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:plugins:error-handler'

const PLUGIN_NAME = 'error-handler'
const PLUGIN_VERION = '1.0.0'

const wrapAndRespond = (request, response, reply) => {
  if (!response.isBoom) {
    response = Boom.wrap(response)
  }

  respond(request, response, reply)
}

const respond = (request, response, reply) => {
  response.output.headers['Guvnor-Request-ID'] = request.id

  reply(response)
}

const errorHandler = (request, reply) => {
  const response = request.response

  if (!(response instanceof Error)) {
    return reply.continue()
  }

  const errorCode = response.code

  if (!errorCode) {
    request.log([DEBUG, CONTEXT], `${request.method.toUpperCase()} ${request.path} failed but could not read error code from ${response.stack || response.message}`)
  } else {
    request.log([DEBUG, CONTEXT], `${request.method.toUpperCase()} ${request.path} resulted in ${errorCode}`)
  }

  if (response.isBoom) {
    return respond(request, response, reply)
  }

  const overrides = request.route.settings.plugins[PLUGIN_NAME]

  if (!overrides) {
    request.log([DEBUG, CONTEXT], `${request.method.toUpperCase()} ${request.path} did not delcare overrides`)

    return wrapAndRespond(request, response, reply)
  }

  if (!overrides[errorCode]) {
    request.log([WARN, CONTEXT], `${request.method.toUpperCase()} ${request.path} did not delcare override for ${errorCode}`)

    return wrapAndRespond(request, response, reply)
  }

  const override = overrides[errorCode](request)
  const error = Boom.create(override.code, override.message)

  request.log([ERROR, CONTEXT], error)

  return wrapAndRespond(request, error, reply)
}

module.exports = lifecycle(PLUGIN_NAME, PLUGIN_VERION, 'onPreResponse', errorHandler)
