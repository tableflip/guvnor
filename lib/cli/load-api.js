'use strict'

const loadApi = require('../local/api')
const logger = require('winston')

module.exports = (certs, overrides, operation) => {
  return loadApi(certs)
  .then(api => {
    return operation(api)
    .then(result => {
      api.disconnect()

      return result
    })
    .catch(error => {
      api.disconnect()

      if (overrides[error.statusCode]) {
        process.stderr.write(overrides[error.statusCode])
        process.exit(1)
      } else {
        logger.debug(error.stack)
      }

      throw error
    })
  })
}
