'use strict'

const through2 = require('through2')
const stringify = require('json-stringify-safe')
const END_STREAM = require('../../common/end-stream-marker')

module.exports = function installApp (server, callback) {
  const outputStream = through2()

  outputStream.done = function () {
    outputStream.write(new Buffer(`${END_STREAM}\n`))
    outputStream.write(new Buffer(stringify(Array.prototype.slice.call(arguments))))
    outputStream.end()
  }

  return outputStream
}
