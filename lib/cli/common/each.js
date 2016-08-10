'use strict'

const async = require('async')

module.exports = (api, items, fn) => {
  const tasks = items.map((item) => {
    return fn.bind(null, api, item)
  })

  async.parallel(tasks, (error) => {
    api.disconnect()

    if (error) {
      throw error
    }
  })
}
