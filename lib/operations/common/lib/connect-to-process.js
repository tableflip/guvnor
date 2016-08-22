'use strict'

const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:common:lib:connect-to-process'

module.exports = function connectToProcess (context, proc) {
  context.log([DEBUG, CONTEXT], 'Connecting to ' + proc.socket)

  return new Promise((resolve, reject) => {
    const socket = proc.socket
    let d

    try {
      d = dnode.connect(socket)
    } catch (error) {
      return reject(error)
    }

    d.on('error', function (error) {
      context.log([WARN, CONTEXT], error)

      reject(error)
    })
    d.on('remote', function (remote) {
      remote = dnodep.toPromise(remote)
      remote.disconnect = d.end.bind(d)

      resolve(remote)
    })
  })
}
