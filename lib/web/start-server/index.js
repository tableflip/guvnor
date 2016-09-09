'use strict'

const config = require('../config')
const Hapi = require('hapi')
const addStatic = require('./add-static')
const addMoonboots = require('./add-moonboots')
const addWebsocket = require('../websocket')
const addClacks = require('./add-clacks')
const addClientConfig = require('./add-client-config')
const startServer = require('./start-server')
const Good = require('good')
const GoodEnough = require('good-enough')
const INFO = require('good-enough').INFO
const CONTEXT = 'web:start-server:index'
const context = require('../../daemon/lib/global-context')

const setupServer = () => {
  return new Promise((resolve, reject) => {
    const options = {
      address: config.HTTPS_ADDRESS,
      port: config.HTTPS_PORT,
      host: config.HTTPS_HOST
    }

    const server = new Hapi.Server()
    server.connection(options)

    context()
    .then(context => {
      return addClacks(context, server)
      .then(() => addMoonboots(context, server))
      .then(() => addStatic(context, server))
      .then(() => startServer(context, server))
      .then(() => addWebsocket(context, server))
      .then(() => addClientConfig(context, server))
      .then(() => {
        server.register({
          register: Good,
          options: {
            reporters: [{
              reporter: GoodEnough,
              events: {
                error: '*',
                log: '*',
                request: '*',
                response: '*',
                wreck: '*',
                ops: '*'
              }
            }]
          }
        })
      })
      .then(() => {
        server.table().forEach(table => table.table.forEach(route => context.log([INFO, CONTEXT], route.method.toUpperCase() + ' ' + route.path)))
        server.connections.forEach(connection => context.log([INFO, CONTEXT], 'Server running at ' + connection.info.uri))
      })
    })
    .then(resolve)
    .catch(reject)
  })
}

module.exports = setupServer
