'use strict'

const findApp = require('./lib/find-app')

const listAppRefs = (context, name) => {
  return findApp(context, name)
  .then(app => app.refs)
}

module.exports = listAppRefs
