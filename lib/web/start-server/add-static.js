'use strict'

var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'web:start-server:add-static'
var path = require('path')
var Inert = require('inert')

const addStatic = (context, server) => {
  return new Promise((resolve, reject) => {
    context.log([DEBUG, CONTEXT], 'Adding static routes')
    server.register(Inert, function () {})

    server.route({
      method: 'GET',
      path: '/images/{param*}',
      handler: {
        directory: {
          path: path.resolve(path.join(__dirname, '../client/public/images'))
        }
      }
    })
    server.route({
      method: 'GET',
      path: '/fonts/{param*}',
      handler: {
        directory: {
          path: [
            path.resolve(path.join(__dirname, '../../../node_modules/bootstrap-material-design/dist/fonts')),
            path.resolve(path.join(__dirname, '../client/public/fonts'))
          ]
        }
      }
    })
    server.route({
      method: 'GET',
      path: '/apple-touch-icon.png',
      handler: (request, reply) => reply.file(path.resolve(path.join(__dirname, '../client/public/apple-touch-icon.png')))
    })

    resolve()
  })
}

module.exports = addStatic
