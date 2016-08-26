'use strict'

const Joi = require('joi')
const os = require('os')
const path = require('path')
const loadOrCreateCaCertificate = require('../../../lib/ca-certificate')
const createProcessCertificate = require('../../../lib/create-process-certificate')
const config = require('../../../config')
const context = require('../../../lib/context')

const createdCertificate = (options, cert) => {
  options.url = `https://localhost:${config.HTTPS_PORT}`
  options.ca = cert.serviceCertificate
  options.cert = cert.certificate
  options.key = cert.clientKey

  return options
}

const createProcess = (request, reply) => {
  const options = request.payload
  options.name = request.params.name

  // remove exec args not prefixed with a dash
  options.execArgv = options.execArgv.filter((arg) => arg.substring(0, 1) === '-')

  return loadOrCreateCaCertificate()
  .then((ca) => createProcessCertificate({
    commonName: request.params.name,
    organization: config.DAEMON_NAME,
    organizationUnit: 'process'
  }, ca))
  .then((cert) => createdCertificate(options, cert))
  .then(options => request.server.methods.createProcess(context(request), options))
}

module.exports = {
  path: '/processes/{name}',
  method: 'POST',
  handler: createProcess,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    },
    validate: {
      params: {
        name: Joi.string()
          .required()
          .lowercase()
          .replace(/[^0-9a-z-_]+/g, ' ')
          .trim()
          .replace(/\s+/g, '.')
      },
      payload: {
        script: Joi.string().required(),
        cwd: Joi.string()
          .default((context) => path.dirname(context.script), 'Where your script executes'),
        group: Joi.string(),
        workers: Joi.number().min(1).max(os.cpus().length),
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
    },
    plugins: {
      'error-handler': {
        'ENOENT': (request) => {
          return {
            code: 404,
            message: `No process found for ${request.params.name}`
          }
        },
        'ENOPROC': (request) => {
          return {
            code: 404,
            message: `No process found for ${request.params.name}`
          }
        }
      }
    }
  }
}
