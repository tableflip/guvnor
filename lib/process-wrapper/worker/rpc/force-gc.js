'use strict'

const forceGc = () => {
  return new Promise((resolve, reject) => {
    try {
      if (global && typeof global.gc === 'function') {
        global.gc()
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = forceGc
