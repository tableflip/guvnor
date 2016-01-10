var Wreck = require('wreck')
var https = require('https')
var fs = require('fs')
var config = require('../config')

var name = process.env[config.DAEMON_ENV_NAME + '_PROCESS_NAME']

function handleResponse (callback, error, response) {
  Wreck.read(response, null, function (bodyError, body) {
    if (!bodyError && body && body.length > 0) {
      body = JSON.parse(body)
    }

    if (!error && bodyError) {
      error = bodyError
    }

    callback(error, body)
  })
}

var wreck = Wreck.defaults({
  baseUrl: process.env[config.DAEMON_ENV_NAME + '_URL']
})

var cert = process.env[config.DAEMON_ENV_NAME + '_CERT_FILE'] ? fs.readFileSync(process.env[config.DAEMON_ENV_NAME + 'CERT_FILE'], 'utf8') : process.env[config.DAEMON_ENV_NAME + '_CERT']
var key = process.env[config.DAEMON_ENV_NAME + '_KEY_FILE'] ? fs.readFileSync(process.env[config.DAEMON_ENV_NAME + '_KEY_FILE'], 'utf8') : process.env[config.DAEMON_ENV_NAME + '_KEY']
var ca = process.env[config.DAEMON_ENV_NAME + '_CA_FILE'] ? fs.readFileSync(process.env[config.DAEMON_ENV_NAME + '_CA_FILE'], 'utf8') : process.env[config.DAEMON_ENV_NAME + '_CA']

// configure Wreck agents
wreck.agents.https = new https.Agent({
  // maxSockets: config.maxSockets,
  // timeout: config.timeout,
  cert: cert,
  key: key,
  ca: ca
})

module.exports = function emit () {
  var args = Array.prototype.slice.call(arguments)
  var event = args.shift()

  var callback = args[args.length - 1]

  if (typeof callback === 'function') {
    args.pop()
  } else {
    callback = function noop () {}
  }

  wreck.request('POST', '/processes/' + name + '/events', {
    payload: JSON.stringify({
      event: event,
      args: args
    })
  }, handleResponse.bind(null, callback))
}
