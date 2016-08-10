'use strict'

const path = require('path')

module.exports = (script) => {
  return path.basename(script)
    .toLowerCase()
    .replace(/[^0-9a-z-_]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
}
