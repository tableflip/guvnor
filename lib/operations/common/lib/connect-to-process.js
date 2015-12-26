var dnode = require('boss-dnode')
var DEBUG = require('good-enough').DEBUG
var WARN = require('good-enough').WARN
var CONTEXT = 'operations:common:lib:connect-to-process'

module.exports = function connectToProcess (context, proc, callback) {
  context.log([DEBUG, CONTEXT], 'Connecting to ' + proc.socket)

  var socket = proc.socket
  var d

  try {
    d = dnode.connect(socket)
  } catch (error) {
    return callback(error)
  }

  d.on('error', function (error) {
    if (callback) {
      callback(error)
      callback = null
    }

    context.log([WARN, CONTEXT], error)
  })
  d.on('remote', function (remote) {
    if (!callback) {
      // would have emitted error event
      return
    }

    callback(null, remote, d.end.bind(d))
  })
}
