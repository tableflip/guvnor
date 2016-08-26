'use strict'

const sendEvent = (event, args) => {
  return new Promise((resolve, reject) => {
    try {
      process.emit.apply(process, [event].concat(args))
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = sendEvent
