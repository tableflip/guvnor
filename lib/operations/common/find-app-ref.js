'use strict'

const findApp = require('./lib/find-app')

const findAppRef = (context, name) => {
  return findApp(context, name)
  .then(app => app.ref)
}

module.exports = findAppRef
