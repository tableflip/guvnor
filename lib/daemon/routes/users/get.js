'use strict'

const context = require('../../lib/context')

const getUsers = (request, reply) => {
  return request.server.methods.listUsers(context(request))
}

module.exports = {
  path: '/users',
  method: 'GET',
  handler: getUsers,
  config: {
    auth: {
      strategy: 'certificate',
      scope: ['user']
    }
  }
}
