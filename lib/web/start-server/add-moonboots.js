var logger = require('winston')
var MoonBootsHapi = require('moonboots_hapi')
var moonBootsConfig = require('./moonboots')

module.exports = function addMoonbootss(server, callback) {
  logger.debug('Adding moonboots')

  server.register({
    register: MoonBootsHapi,
    options: moonBootsConfig({
      isDev: true
    })
  }, callback)
}
