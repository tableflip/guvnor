var async = require('async')

module.exports = function each (api, items, fn) {
  var tasks = items.map(function map (item) {
    return fn.bind(null, api, item)
  })

  async.parallel(tasks, function (error) {
    api.disconnect()

    if (error) {
      throw error
    }
  })
}
