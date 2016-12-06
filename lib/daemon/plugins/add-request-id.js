'use strict'

const lifecycle = require('./lifecycle')
const config = require('../config')

const PLUGIN_NAME = 'add-request-id'
const PLUGIN_VERION = '1.0.0'

const addRequestId = (request, reply) => {
  request.response.headers[`${config.DAEMON_NAME}-request-id`] = request.id

  reply.continue()
}

module.exports = lifecycle(PLUGIN_NAME, PLUGIN_VERION, 'onPreResponse', addRequestId)
