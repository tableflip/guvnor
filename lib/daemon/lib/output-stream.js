var through2 = require('through2')
var stringify = require('json-stringify-safe')
var END_STREAM = require('../../common/end-stream-marker')

module.exports = function installApp (server, callback) {
  var outputStream = through2()

  outputStream.done = function () {
    outputStream.write(new Buffer(END_STREAM + '\n'))
    outputStream.write(new Buffer(stringify(Array.prototype.slice.call(arguments))))
    outputStream.end()
  }

  return outputStream
}
