'use strict'

const dnode = require('boss-dnode')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:common:lib:connect-to-process'

module.exports = function connectToProcess (context, proc, callback) {
  context.log([DEBUG, CONTEXT], 'Connecting to ' + proc.socket)

  const socket = proc.socket
  let d

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
