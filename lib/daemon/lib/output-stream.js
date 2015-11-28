var through2 = require('through2')
var stringify = require('json-stringify-safe')

var DELIMITER = '-----guvnor-stream-end-----'

module.exports = function createOutputStream () {
  var outputStream = through2()
  outputStream.done = function () {
    outputStream.write(new Buffer(DELIMITER + '\n'))
    outputStream.write(new Buffer(stringify(arguments)))

    outputStream.end()
  }

  return outputStream
}
