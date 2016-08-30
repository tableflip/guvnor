'use strict'

const logger = require('winston')
const daemon = require('./daemon')
const loadApi = require('../../../lib/local')

module.exports = daemon
.then(certs => loadApi(certs))
.then(api => {
  api.on('*', (event) => {
    logger.debug(`Incoming event: ${JSON.stringify(event.data)}`)
  })
  api.on('error', console.error)

  return api
})
