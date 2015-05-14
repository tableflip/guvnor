var path = require('path')

module.exports = function processNameFromScript (script) {
  return path.basename(script)
    .toLowerCase()
    .replace(/[^0-9a-z-]+/g, ' ')
    .trim()
    .replace(/\s+/g, '.')
}
