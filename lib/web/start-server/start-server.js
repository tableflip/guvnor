'use strict'

const DEBUG = require('good-enough').DEBUG
const ERROR = require('good-enough').ERROR
const CONTEXT = 'web:start-server:start-static'

const startServer = (context, server) => {
  return new Promise((resolve, reject) => {
    context.log([DEBUG, CONTEXT], 'Starting server')

    server.start(error => {
      if (error) {
        context.log([ERROR, CONTEXT], 'Could not start server')
        context.log([ERROR, CONTEXT], error)
        return reject(error)
      }

      context.log([DEBUG, CONTEXT], 'Started server')
      resolve()
    })
  })
}

module.exports = startServer
