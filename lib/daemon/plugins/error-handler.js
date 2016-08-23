'use strict'

const Boom = require('boom')
const lifecycle = require('./lifecycle')
const ERROR = require('good-enough').ERROR
const WARN = require('good-enough').WARN
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:plugins:error-handler'

const PLUGIN_NAME = 'error-handler'
const PLUGIN_VERION = '1.0.0'

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

  const overrides = request.route.settings.plugins[PLUGIN_NAME]

  if (!overrides) {
    request.log([DEBUG, CONTEXT], `${request.method.toUpperCase()} ${request.path} did not delcare overrides`)

    return reply(response)
  }

  if (!overrides[errorCode]) {
    request.log([WARN, CONTEXT], `${request.method.toUpperCase()} ${request.path} did not delcare override for ${errorCode}`)

    return reply(response)
  }

  const override = overrides[errorCode](request)
  const error = Boom.create(override.code, override.message)

  request.log([ERROR, CONTEXT], error)

  return reply(error)
/*
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

  reply(error)*/
}

module.exports = lifecycle(PLUGIN_NAME, PLUGIN_VERION, 'onPreResponse', errorHandler)
