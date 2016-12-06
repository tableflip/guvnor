'use strict'

const config = require('./config')
const loadApi = require('../local/api')
const logger = require('winston')

module.exports = (certs, overrides, operation) => {
  return loadApi(config.DAEMON_URL, certs)
  .then(api => {
    return operation(api)
    .then(result => {
      api.disconnect()

      return result
    })
    .catch(error => {
      api.disconnect()

      if (error.response && error.response.status && overrides[error.response.status]) {
        process.stderr.write(overrides[error.response.status] + '\n')
        process.exit(1)
      } else {
        logger.debug(error.stack)
      }

      throw error
    })
  })
}
