'use strict'

const heapdump = require('heapdump')
const fs = require('fs-promise')
const crypto = require('crypto')

const takeHeapSnapshot = (path) => {
  return new Promise((resolve, reject) => {
    try {
      heapdump.writeSnapshot(path)
      resolve(path)
    } catch (error) {
      resolve(error)
    }
  })
  .then(path => fs.stat(path))
  .then(stats => {
    return {
      id: crypto.createHash('md5').update(path).digest('hex'),
      date: stats.birthtime.getTime(),
      path: path,
      size: stats.size
    }
  })
}

module.exports = takeHeapSnapshot
