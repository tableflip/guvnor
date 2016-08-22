'use strict'

const connectToProcess = require('./connect-to-process')
const operations = require('../../')
const PROCESS_STATUS = require('../../../common/process-status')
const DEBUG = require('good-enough').DEBUG
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:common:lib:report-process-status'

const unique = (array) => {
  const output = {}

  array.forEach(function (item) {
    output[item] = true
  })

  return Object.keys(output)
}

const findProcessStatus = (context, proc) => {
  return new Promise((resolve, reject) => {
    if (proc.status !== PROCESS_STATUS.RUNNING) {
      const error = new Error('Process was not running')
      error.code = 'EPROCNOTRUNNING'

      return reject(error)
    }

    connectToProcess(context, proc)
    .then(remote => remote.reportStatus()
      .then(status => {
        remote.disconnect()

        return status
      })
    )
    .then(results => {
      context.log([DEBUG, CONTEXT], 'reported status ' + JSON.stringify(results))

      const status = 'running'
      const uids = unique([results.master.uid].concat(results.workers.map((worker) => worker.uid)))
      const gids = unique([results.master.gid].concat(results.workers.map((worker) => worker.gid)))

      return Promise.all([
        Promise.all(uids.map(uid => operations.findUserDetails(context, uid))),
        Promise.all(gids.map(gid => operations.findGroupDetails(context, gid)))
      ])
      .then(res => {
        const users = res[0]
        const groups = res[1]

        results.master.user = users[results.master.uid].name
        results.master.group = groups[results.master.gid].name

        results.workers.forEach(function (worker) {
          worker.user = users[worker.uid].name
          worker.group = groups[worker.gid].name
        })

        proc.status = status
        proc.master = results.master
        proc.workers = results.workers

        return results
      })
    })
    .catch(error => {
      context.log([WARN, CONTEXT], `Error connecting to process ${proc.name}`)
      context.log([WARN, CONTEXT], error)

      if (typeof error === 'string' || error instanceof String) {
        error = new Error(error.trim())

        context.log([WARN, CONTEXT], 'Error reporting status for process ' + proc.name)
        context.log([WARN, CONTEXT], error)

        proc.status = 'error'
      }

      if (error.code === 'ENOENT') {
        // could not find socket
        error = null
        proc.status = 'unknown'
      } else if (error.code === 'ECONNREFUSED') {
        // socket is closed
        error = null
        proc.status = 'stopped'
      }

      if (error) {
        throw error
      }
    })
    .then(resolve)
    .catch(reject)
  })
}

module.exports = findProcessStatus
