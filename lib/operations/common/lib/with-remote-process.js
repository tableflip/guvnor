'use strict'

const dnode = require('boss-dnode')
const dnodep = require('dnode-promise')
const INFO = require('good-enough').INFO
const CONTEXT = 'operations:common:lib:with-remote'
const PROCESS_STATUS = require('../../../common/process-status')
const error = require('../../../common/error')

const withRemoteProcess = (context, proc, func) => {
  context.log([INFO, CONTEXT], `With remote process ${proc.name}`)

  return new Promise((resolve, reject) => {
    if (proc.status !== PROCESS_STATUS.RUNNING) {
      return reject(error(error.ENOTRUNNING, `Process ${proc.name} was not running, it was ${proc.status}`))
    }

    context.log([INFO, CONTEXT], `Connecting to ${proc.socket}`)

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

      context.log([INFO, CONTEXT], `Connected to ${proc.socket}`)

      resolve(remote)
    })
  })
  .then(remote => {
    return func(remote)
    .then(result => {
      context.log([INFO, CONTEXT], `Disconnecting from ${proc.socket}`)
      remote.disconnect()

      if (result !== undefined && result !== null) {
        context.log([INFO, CONTEXT], `Returning result ${JSON.stringify(result)}`)

        return result
      }
    })
    .catch(error => {
      try {
        context.log([INFO, CONTEXT], `Encountered error, disconnecting from ${proc.socket}`)
        remote.disconnect()
      } catch (error) {
        throw error
      }

      throw error
    })
  })
}

module.exports = withRemoteProcess
