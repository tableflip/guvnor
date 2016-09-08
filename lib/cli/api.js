'use strict'

const config = require('./config')
const loadApi = require('../local/api')

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
        return overrides[error.statusCode]
      }

      throw error
    })
  })
}
