'use strict'

const withRemoteProcess = require('./lib/with-remote-process')
const operations = require('../')
const INFO = require('good-enough').INFO
const WARN = require('good-enough').WARN
const CONTEXT = 'operations:common:find-process-details'
const PROCESS_STATUS = require('../../common/process-status')

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
      .then(([users, groups]) => {
        status.master.user = users.find(user => user.uid === status.master.uid).name
        status.master.group = groups.find(group => group.gid === status.master.gid).name

        status.workers.forEach(worker => {
          worker.user = users.find(user => user.uid === worker.uid).name
          worker.group = groups.find(group => group.gid === group.gid).name
        })

        proc.master = status.master
        proc.workers = status.workers

        return proc
      })
    })
    .catch(error => {
      if (proc.status === 'running') {
        proc.status = PROCESS_STATUS.UNKNOWN
      }

      context.log([WARN, CONTEXT], `Could not get process status for ${name} - ${error.stack}, returning ${JSON.stringify(proc)}`)

      return proc
    })
  })
}

module.exports = findProcessDetails
