'use strict'

const plistValue = (dict, key) => {
  if (Array.isArray(dict[key])) {
    return dict[key][0]
  }

  return dict[key]
}

module.exports = plistValue
