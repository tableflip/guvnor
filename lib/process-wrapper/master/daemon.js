'use strict'

const Wreck = require('wreck')
const https = require('https')
const fs = require('fs')
const config = require('../config')
const child_process = require('child_process')

const name = process.env[`${config.DAEMON_ENV_NAME}_PROCESS_NAME`]

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

const wreck = Wreck.defaults({
  baseUrl: process.env[`${config.DAEMON_ENV_NAME}_URL`]
})

const cert = process.env[`${config.DAEMON_ENV_NAME}_CERT_FILE`] ? fs.readFileSync(process.env[`${config.DAEMON_ENV_NAME}_CERT_FILE`], 'utf8') : process.env[`${config.DAEMON_ENV_NAME}_CERT`]
const key = process.env[`${config.DAEMON_ENV_NAME}_KEY_FILE`] ? fs.readFileSync(process.env[`${config.DAEMON_ENV_NAME}_KEY_FILE`], 'utf8') : process.env[`${config.DAEMON_ENV_NAME}_KEY`]
const ca = process.env[`${config.DAEMON_ENV_NAME}_CA_FILE`] ? fs.readFileSync(process.env[`${config.DAEMON_ENV_NAME}_CA_FILE`], 'utf8') : process.env[`${config.DAEMON_ENV_NAME}_CA`]

// configure Wreck agents
wreck.agents.https = new https.Agent({
  // maxSockets: config.maxSockets,
  // timeout: config.timeout,
  cert: cert,
  key: key,
  ca: ca
})

const noop = () => {}

function emit () {
  let args = Array.prototype.slice.call(arguments)
  const event = args.shift()

  // Error fields are not JSONable..
  args = args.map(arg => {
    if (arg instanceof Error) {
      return {
        message: arg.message,
        stack: arg.stack,
        code: arg.code
      }
    }

    return arg
  })

  return new Promise((resolve, reject) => {
    wreck.request('POST', `/processes/${name}/events`, {
      payload: JSON.stringify({
        event: event,
        args: args
      })
    }, handleResponse.bind(null, (error, result) => {
      if (error) {
        return reject(error)
      }

      resolve(result)
    }))
  })
}

module.exports = emit

module.exports.sync = function () {
  // have to do this synchronously as no async is allowed inside process.on('exit')
  const result = child_process.spawnSync(process.execPath, [require.resolve('./daemon-sync')], {
    input: JSON.stringify(Array.prototype.slice.call(arguments)),
    env: process.env
  })

  if (result.status !== 0) {
    console.info('Failed to send event!')
    console.error(result.stderr.toString('utf8'))
  }
}
