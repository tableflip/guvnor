'use strict'

function createKey (key, current) {
  let name = current ? `${current}_` : ''
  name += key.toUpperCase()

  return name
}

function toEnv (env, object, current) {
  for (const key in object) {
    if (typeof object[key] === 'string' ||
    object[key] instanceof String ||
    !isNaN(object[key]) ||
    object[key] === true ||
    object[key] === false) {
      env[createKey(key, current)] = object[key]
    } else {
      toEnv(env, object[key], createKey(key, current))
    }
  }
}

module.exports = function convert (obj) {
  const output = {}

  toEnv(output, obj)

  return output
}
