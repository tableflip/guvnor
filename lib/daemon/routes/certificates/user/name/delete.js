'use strict'

const Joi = require('joi')
const fs = require('fs-promise')
const path = require('path')
const context = require('../../../../lib/context')
const config = require('../../../../config')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:routes:certificates:user:delete'

const deleteUserCertificate = (request, reply) => {
  return request.server.methods.findUserDetails(context(request), request.params.name)
  .then(user => {
    const bundleFile = path.join(user.home, '.config', config.DAEMON_NAME, `${user.name}.keys`)

    request.log([DEBUG, CONTEXT], `Removing certificate for user ${user.name} at ${bundleFile}`)

    return fs.unlink(bundleFile)
  })
}

module.exports = {
  path: '/certificates/user/{name}',
  method: 'DELETE',
  handler: deleteUserCertificate,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['admin']
    },
    validate: {
      payload: {
        user: Joi.string().required()
      }
    }
  }
}
