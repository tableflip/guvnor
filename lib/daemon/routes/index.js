'use strict'

const Boom = require('boom')

module.exports = function routes (server) {
  return Promise.all([
    './apps/get',
    './apps/post',
    './apps/name/delete',
    './apps/name/get',
    './apps/name/patch',
    './apps/name/ref/get',
    './apps/name/refs/get',
    './apps/name/refs/put',
    './certificates/ca/get',
    './certificates/user/name/delete',
    './certificates/user/name/post',
    './processes/get',
    './processes/logs/get',
    './processes/name/delete',
    './processes/name/get',
    './processes/name/patch',
    './processes/name/post',
    './processes/name/events/post',
    './processes/name/exceptions/get',
    './processes/name/exceptions/delete',
    './processes/name/exceptions/id/delete',
    './processes/name/gc/post',
    './processes/name/heapsnapshot/get',
    './processes/name/heapsnapshot/post',
    './processes/name/heapsnapshot/delete',
    './processes/name/heapsnapshot/id/delete',
    './processes/name/heapsnapshot/id/get',
    './processes/name/logs/get',
    './processes/name/signals/post',
    './users/get',
    './get'
  ].map((routePath) => {
    return new Promise((resolve, reject) => {
      try {
        const route = require(routePath)
        const handler = route.handler

        route.handler = (request, reply) => {
          const result = handler(request, reply)

          if (result) {
            const response = reply(result)

            if (request.method === 'delete') {
              response.statusCode = 204
            }
          }
        }

        server.route(route)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }))
}
