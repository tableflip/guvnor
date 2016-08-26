'use strict'

module.exports = (code, message) => {
  const error = new Error(message)
  error.code = code

  for (let key in error) {
    error[key] = error[key]
  }

  return error
}

module.exports.ENOPROC = 'ENOPROC'
module.exports.ENOTRUNNING = 'ENOTRUNNING'
module.exports.ERUNNING = 'ERUNNING'
module.exports.EINVALIDAPP = 'EINVALIDAPP'
module.exports.EINVALIDAPPDIR = 'EINVALIDAPPDIR'
module.exports.ENOAPP = 'ENOAPP'
