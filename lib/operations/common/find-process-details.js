'use strict'

const withRemoteProcess = require('./lib/with-remote-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:common:find-process-details'

const unique = (array) => {
  const output = {}

  array.forEach(function (item) {
    output[item] = true
  })

  return Object.keys(output)
}

const findProcessDetails = (context, name) => {
  context.log([INFO, CONTEXT], `Finding process details for ${name}`)

  return operations.findProcess(context, name)
  .then(proc => {
    return withRemoteProcess(context, proc, remote => {
      context.log([INFO, CONTEXT], 'Reporting status')
      return remote.reportStatus()
    })
    .then(status => {
      context.log([INFO, CONTEXT], `reported status ${JSON.stringify(status)}`)

      const uids = unique([status.master.uid].concat(status.workers.map((worker) => worker.uid)))
      const gids = unique([status.master.gid].concat(status.workers.map((worker) => worker.gid)))

      return Promise.all([
        Promise.all(uids.map(uid => operations.findUserDetails(context, uid))),
        Promise.all(gids.map(gid => operations.findGroupDetails(context, gid)))
      ])
      .then(res => {
        const users = res[0]
        const groups = res[1]

        status.master.user = users[status.master.uid].name
        status.master.group = groups[status.master.gid].name

        status.workers.forEach(function (worker) {
          worker.user = users[worker.uid].name
          worker.group = groups[worker.gid].name
        })

        proc.master = status.master
        proc.workers = status.workers

        return proc
      })
    })
    .catch(error => {
      context.log([WARN, CONTEXT], `Could not get process status for ${name} - ${error.message}, returning ${JSON.stringify(proc)}`)

      return proc
    })
  })
}

module.exports = findProcessDetails
