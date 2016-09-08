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
        error.message = overrides[error.statusCode]
        error.code = 'OVERRIDDEN'
      } else {
        logger.debug(error.stack)
      }

      throw error
    })
  })
}
