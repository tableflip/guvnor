'use strict'

const context = require('../../../../lib/context')
const caCertificate = require('../../../../lib/ca-certificate')
const createCertificate = require('../../../../lib/create-user-certificate')
const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'daemon:routes:certificates:user:post'

const createUserCertificate = (request) => {
  return Promise.all([
    caCertificate(context(request)),
    request.server.methods.findUserDetails(context(request), request.params.name)
  ])
  .then(results => {
    const ca = results[0]
    const user = results[1]

    request.log([DEBUG, CONTEXT], `Creating certificate for user ${user.name}`)

    return createCertificate(context(request), ca, user)
  })
}

module.exports = {
  path: '/certificates/user/{name}',
  method: 'POST',
  handler: createUserCertificate,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['admin']
    },
    plugins: {
      'error-handler': {
        'ENOUSER': (request) => {
          return {
            code: 404,
            message: `A user with the name ${request.params.name} did not exist`
          }
        }
      }
    }
  }
}
