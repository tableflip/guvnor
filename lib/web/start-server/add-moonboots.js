var DEBUG = require('good-enough').DEBUG
var CONTEXT = 'web:start-server:add-moonboots'
var MoonBootsHapi = require('moonboots_hapi')
var moonBootsConfig = require('./moonboots')

module.exports = function addMoonboots (server, callback) {
  server.log([DEBUG, CONTEXT], 'Adding moonboots')

  server.register({
    register: MoonBootsHapi,
    options: moonBootsConfig({
      isDev: true
    })
  }, callback)
}
