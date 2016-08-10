'use strict'

const findApp = require('./lib/find-app')

module.exports = function findAppRef (context, name, callback) {
  findApp(context, name, (error, result) => {
    callback(error, error ? undefined : result)
  })
}
