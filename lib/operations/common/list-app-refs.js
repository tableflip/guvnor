'use strict'

const operations = require('../')

const listAppRefs = (context, name) => {
  return operations.findApp(context, name)
  .then(app => app.refs)
}

module.exports = listAppRefs
