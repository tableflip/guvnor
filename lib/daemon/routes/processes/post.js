var Joi = require('joi')
var os = require('os')
var path = require('path')
var Boom = require('boom')
var loadOrCreateCaCertificate = require('../../lib/ca-certificate')
var createCertificate = require('../../lib/create-certificate')
var config = require('../../config')
var async = require('async')
var done = require('../../lib/done')

module.exports = function createProcess (server, callback) {
  server.route({
    path: '/processes',
    method: 'POST',
    handler: function createProcessHandler (request, reply) {
      var options = request.payload

      async.waterfall([
        loadOrCreateCaCertificate,
        createCertificate.bind(null, {
          commonName: options.name,
          organization: 'guvnor',
          organizationUnit: 'process'
        }),
        function createdCertificate (cert, next) {
          options.url = 'https://localhost:' + config.HTTPS_PORT
          options.ca = cert.serviceCertificate
          options.cert = cert.certificate
          options.key = cert.clientKey

          next(null, options)
        },
        request.server.methods.createProcess.bind(null, request.auth.credentials)
      ], function createdProcess (error, proc) {
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
        payload: {
          script: Joi.string().required(),
          cwd: Joi.string()
            .default(function (context) {
              return path.dirname(context.script)
            }, 'Where your script executes'),
          group: Joi.string(),
          instances: Joi.number().min(1).max(os.cpus().length),
          name: Joi.string()
            .default(function (context) {
              return path.basename(context.script)
            }, 'The name of your process')
            .lowercase()
            .replace(/[^0-9a-z-]+/g, ' ')
            .trim()
            .replace(/\s+/g, '.'),
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
