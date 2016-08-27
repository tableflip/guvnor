'use strict'

const fs = require('fs-promise')
const path = require('path')
const context = require('../../../../lib/context')
const config = require('../../../../config')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:routes:certificates:user:delete'

const deleteUserCertificate = (request) => {
  return request.server.methods.findUserDetails(context(request), request.params.name)
  .then(user => {
    const dir = path.join(user.home, '.config', config.DAEMON_NAME)

    request.log([DEBUG, CONTEXT], `Removing certificate directory for user ${user.name} at ${dir}`)

    return fs.remove(dir)
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
    }
  }
}
