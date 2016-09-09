'use strict'

const DEBUG = require('good-enough').DEBUG
const CONTEXT = 'web:start-server:add-moonboots'
const MoonBootsHapi = require('moonboots_hapi')
const moonBootsConfig = require('./moonboots')

const addMoonboots = (context, server) => {
  return new Promise((resolve, reject) => {
    context.log([DEBUG, CONTEXT], 'Adding moonboots')

    server.register({
      register: MoonBootsHapi,
      options: moonBootsConfig({
        isDev: true
      })
    })
    .then(resolve)
    .catch(reject)
  })
}

module.exports = addMoonboots
