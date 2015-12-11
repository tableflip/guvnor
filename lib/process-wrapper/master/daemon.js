var Wreck = require('wreck')
var https = require('https')
var fs = require('fs')

var name = process.env.GUVNOR_PROCESS_NAME

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
  baseUrl: process.env.GUVNOR_URL
})

var cert = process.env.GUVNOR_CERT_FILE ? fs.readFileSync(process.env.GUVNOR_CERT_FILE, 'utf8') : process.env.GUVNOR_CERT
var key = process.env.GUVNOR_KEY_FILE ? fs.readFileSync(process.env.GUVNOR_KEY_FILE, 'utf8') : process.env.GUVNOR_KEY
var ca = process.env.GUVNOR_CA_FILE ? fs.readFileSync(process.env.GUVNOR_CA_FILE, 'utf8') : process.env.GUVNOR_CA

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
