'use strict'

const Joi = require('joi')
const os = require('os')
const path = require('path')
const Boom = require('boom')
const loadOrCreateCaCertificate = require('../../../lib/ca-certificate')
const createProcessCertificate = require('../../../lib/create-process-certificate')
const config = require('../../../config')
const async = require('async')
const done = require('../../../lib/done')

const createdCertificate = (options, cert, next) => {
  options.url = `https://localhost:${config.HTTPS_PORT}`
  options.ca = cert.serviceCertificate
  options.cert = cert.certificate
  options.key = cert.clientKey

  next(null, options)
}

module.exports = function createProcess (server, callback) {
  server.route({
    path: '/processes/{name}',
    method: 'POST',
    handler: function createProcessHandler (request, reply) {
      const options = request.payload

      async.waterfall([
        loadOrCreateCaCertificate,
        createProcessCertificate.bind(null, {
          commonName: request.params.name,
          organization: config.DAEMON_NAME,
          organizationUnit: 'process'
        }),
        createdCertificate.bind(null, options),
        request.server.methods.createProcess.bind(null, {
          user: request.auth.credentials,
          log: request.log.bind(request)
        }, request.params.name)
      ], (error, proc) => {
        if (error) {
          if (error.code === 'EEXIST') {
            return done(reply, Boom.conflict(error.message))
          }

          return done(reply, error)
        }

        reply(proc).code(201)
      })
    },
    config: {
      auth: {
        strategy: 'certificate',
        scope: ['user']
      },
      validate: {
        params: {
          name: Joi.string().required()
        },
        payload: {
          script: Joi.string().required(),
          cwd: Joi.string()
            .default((context) => path.dirname(context.script), 'Where your script executes'),
          group: Joi.string(),
          instances: Joi.number().min(1).max(os.cpus().length),
          argv: Joi.array().items(Joi.string())
            .default([]),
          execArgv: Joi.array().items(Joi.string())
            .default([]),
          debug: Joi.boolean(),
          env: Joi.object(),
          chroot: Joi.string(),
          interpreter: Joi.string()
            .default(process.execPath)
        }
      }
    }
  })

  callback()
}
