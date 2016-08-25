'use strict'

const operations = require('../')

const findAppRef = (context, name) => {
  return operations.findApp(context, name)
  .then(app => app.ref)
}

module.exports = findAppRef
